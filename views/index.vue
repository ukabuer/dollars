<template>
    <div class="container">
        <welcome class="welcome" v-if="!login" :attention="attention"></welcome>

        <div class="sidebar" v-if="login">
            <h2>Channels</h2>
            <ul class="channels target">
                <li v-for="channel in channels" @click="changeTarget('channels', channel.name)" :class="channel.joined ? 'joined' : ''">
                    #{{ channel.name }}
                    <span v-if="channel.newMsg > 0">{{ channel.newMsg > 99 ? 99 : channel.newMsg }}</span>
                </li>
            </ul>

            <h2>Users</h2>
            <ul class="users target">
                <li v-for="user in users" v-if="user.name != username" :class="user.online ? 'online' : ''" @click="changeTarget('users', user.name)">
                    {{ user.name }}
                    <span v-if="user.newMsg > 0">{{ user.newMsg > 99 ? 99 : user.newMsg}}</span>
                </li>
            </ul>
        </div>

        <div class="chat" v-if="login">
            <div class="main">
                <h1>{{ target }}</h1>
                <div class="control" v-if="at == 'channels'">
                    <span>频道成员</span>
                    <span v-if="target != 'default'" @click="leave">离开频道</span>
                </div>
                <div class="messages" id="messages">
                    <div v-for="msg in this[at][target].messages" :class="msg.from == username ? 'self' : ''">
                        <div v-if="!msg.system" class="avatar"></div>
                        <div :class="'content' + (msg.system ? ' system' : '')">
                            <div class="meta">
                                <span v-if="!msg.system">{{ msg.from }}</span>
                                <span class="time">{{ displayTime() }}</span>
                            </div>
                            <p :style="msg.system ? '' :'background-color:'+msg.color">{{ msg.content }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <form @submit.prevent="send">
                <input v-model="input" autocomplete="off" />
                <button>Post!</button>
            </form>
        </div>
    </div>
</template>

<script>
    import Welcome from './components/welcome.vue'

    export default {
        components: {
            Welcome        
        },
        
        data() {
            return {
                channels: {
                    default: {
                        name: 'default',
                        messages: []
                    }
                },
                channelUsers: [],
                users: {},
                input: '',
                target: 'default',
                at: 'channels',
                username: null,
                attention: null,
                login: false,
                hasInit: false
            }
        },

        methods: {
            init(socket) {
                this.password = this.passwordAgain = null
                this.login = true

                if (this.hasInit) {
                    return
                }
                this.hasInit = true
                socket.on('message', (message) => {
                    this.recieve(message)
                })

                socket.on('login', (username) => {
                    this.updateUser(username, true)
                })

                socket.on('logout', (username) => {
                    this.updateUser(username, false)
                })

                socket.on('join', (channel) => {
                    this.joinChannel(channel)
                })

                socket.on('exit', (info) => {
                    this.login = false
                    this.attention = info
                    socket.disconnect()
                    socket.open()
                })

                socket.on('channelUsers', (channelUsers) => {
                    this.channelUsers = channelUsers
                })

                window.onunload = window.onpagehide = window.onbeforeunload = () => {
                    socket.emit('logout')
                    socket.disconnect()
                }
            },

            loadChatroom(data) {
                let channels = data.joined
                data.channelList.forEach((channel) => {
                    if (undefined == channels[channel]) {
                        channels[channel] = {
                            name: channel,
                            messages: [],
                            joined: false
                        }
                    } else {
                        let newMsg = 0
                        channels[channel].messages.forEach((message) => {
                            if (message.time > data.lastLogoutTime) {
                                newMsg++
                            }
                        })
                        channels[channel].newMsg = newMsg
                    }
                })

                this.channels = channels
                this.users = data.users
                for (let user in data.offlineMsgs) {
                    this.users[user].newMsg = data.offlineMsgs[user]
                }
                this.scrollTobottom()
            },

            send() {
                if (this.input == '')
                    return

                socket.emit('message', {
                    content: this.input,
                    to: this.target,
                    at: this.at
                })
                this.input = ''
            },

            recieve(message) {
                let target = message.to, at = message.at
                if (at == 'users' && target == this.username) {
                    target = message.from
                }

                this[at][target].messages.push(message)

                if (this.target != target) {
                    let tmp = Object.assign({}, this[at][target])
                    if (tmp.newMsg === undefined)
                        tmp.newMsg = 0
                    tmp.newMsg++
                    this.$set(this[at], target, tmp)
                }

                this.scrollTobottom()
            },

            changeTarget(at, target) {
                this.at = at
                this.target = target
                if (at == 'channels' && this[at][target].joined != true) {
                    socket.emit('join', target)
                } else {
                    this[at][target].newMsg = 0
                    this.scrollTobottom()
                }
            },

            leave() {
                let channel = Object.assign({}, this.channels[this.target])
                channel.joined = false
                this.$set(this.channels, this.target, channel)
                socket.emit('leave', this.target)

                this.changeTarget('channels', 'default')
            },

            getChannelUsers() {
                socket.emit('channelUsers', this.target)
            },

            updateUser(username, online) {
                let user = this.users[username]
                if (undefined == user) {
                    user = {
                        name: username,
                        online: true,
                        messages: []
                    }
                } else {
                    user = Object.assign({}, user)
                    user.online = online
                }
                this.$set(this.users, username, user)
                if (online == false && this.target == username) {
                    this.recieve({
                        content: username + '下线了',
                        from: 'system',
                        to: this.user,
                        at: 'users',
                        time: Date.now(),
                        system: true
                    })
                }
            },

            joinChannel(channel) {
                channel.joined = true
                channel.newMsg = 0
                this.$set(this.channels, channel.name, channel)
            },

            scrollTobottom() {
                this.$nextTick(() => {
                    let messageBox = document.querySelector('#messages')
                    messageBox.scrollTop = messageBox.scrollHeight
                })
            },

            displayTime(time) {
                let date = new Date(time)
                let today = new Date()
                let basic = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
                
                if (today.getDate() == date.getDate()) {
                    return basic
                }

                basic = (date.getMonth()+1) + '/' + date.getDate() + ' ' + basic
                if (today.getFullYear() == date.getFullYear()) {
                    return basic
                }

                return date.getFullYear() + '/' + basic
            }
        },

        created() {
            socket.on('signup failed', (info) => {
                this.attention = info
            })

            socket.on('login succeed', (chatroom) => {
                this.init(socket)
                this.loadChatroom(chatroom)
            })

            socket.on('login failed', (info) => {
                this.attention = info
            })

            window.onbeforeunload = () => {
                socket.disconnect()
            }
        }
    }

</script>

<style>
    * {
        box-sizing: border-box;
    }
    
    html,
    body {
        height: 100%;
        margin: 0;
        padding: 0;
    }
    
    .container {
        height: 100%;
        background-color: #0a0a0a;
        color: #fff;
    }
    
    .welcome {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
    }

    .welcome form > div {
        width: 300px;
        margin-bottom: 10px;
    }

    .welcome span {
        display: inline-block;
        width: 80px;
    }

    .welcome input {
        padding: 5px 10px;
    }

    .welcome button, .welcome .switch {
        padding: 8px 15px;
        margin-right: 30px;
        margin-top: 10px;
        border: none;
        background-color: firebrick;
        color: #fff;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
    }

    .welcome .switch {
        display: inline;
    }

    .welcome .attention {
        color: red;
    }

    .sidebar {
        position: absolute;
        width: 200px;
        height: 100%;
        padding-left: 20px;
    }
    
    .channels {
        color: #bbb;
    }
    
    .channels .joined {
        color: #fff;
    }
    
    .target {
        padding: 0;
    }

    .target li {
        display: block;
        margin: 10px;
        line-height: 15px;
        height: 20px;
    }

    .users li::before {
        display: inline-block;
        content: "";
        width: 8px;
        height: 8px;
        background-color: gray;
        border-radius: 100%
    }

    .users li.online::before {
        background-color: yellowgreen;
    }
    
    .target li:hover {
        cursor: pointer;
    }
    
    .target li span {
        display: inline-block;
        width: 25px;
        height: 15px;
        border-radius: 5px;
        font-size: 12px;
        text-align: center;
        background-color: orangered;
    }
    
    .chat {
        position: absolute;
        height: 100%;
        left: 200px;
        right: 0px;
        overflow: hidden;
    }

    .chat .control {
        position: absolute;
        top: 120px;
        right: 50px;
    }

    .chat .control span {
        margin-right: 10px;
        cursor: pointer;
    }
    
    .time {
        font-size: 12px;
        color: #ddd;
    }
    
    .avatar {
        position: relative;
        float: left;
        top: 5px;
        width: 50px;
        height: 50px;
        border: 2px solid #fff;
        border-radius: 100%;
        margin: 0 20px;
    }
    
    .content p {
        display: inline-block;
        max-width: 50%;
        margin-top: 5px;
        padding: 10px 25px;
        border: 4px solid #eee;
        border-radius: 10px;
        background-color: yellowgreen;
        font-size: 16px;
        word-wrap: break-word;
        text-align: left;
        color: #eee;
    }
    
    .content.system {
        height: 20px;
        line-height: 20px;
        text-align: center;
    }
    
    .content.system .meta {
        display: inline;
    }
    
    .content.system p {
        display: inline;
        padding: 0;
        border: none;
        font-size: 12px;
        color: #ddd;
        background-color: initial;
    }
    
    .main {
        position: absolute;
        padding-top: 110px;
        width: 100%;
        height: 100%;
        bottom: 100px;
    }
    
    .main h1 {
        margin: 0;
    }
    
    .messages {
        height: 100%;
        padding-top: 10px;
        border-top: 1px solid #333;
        overflow-y: scroll;
    }
    
    .messages>div {
        margin-bottom: 10px;
    }
    
    .messages .self .avatar {
        float: right;
    }
    
    .messages .self .content {
        text-align: right;
    }
    
    .chat form {
        position: absolute;
        bottom: 0;
        height: 40px;
        width: 100%;
    }
    
    .chat form input {
        height: 100%;
        border: 0;
        padding: 10px;
        width: 90%;
    }
    
    .chat form button {
        height: 100%;
        width: 9%;
        background: rgb(130, 224, 255);
        border: none;
        padding: 5px;
    }
</style>