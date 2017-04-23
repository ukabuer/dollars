<template>
    <div class="container">

        <div class="welcome" v-if="!login">
            <h1>{{ loginMode ? '登录' : '注册' }}</h1>
            <form @submit.prevent="submitAuth">
                <div>
                    <span>用户名</span>
                    <input type="text" v-model="username">
                </div>

                <div>
                    <span>密码</span>
                    <input type="password" v-model="password">
                </div>
                
                <div v-if="!loginMode">
                    <span>重复密码</span>
                    <input type="password" v-model="passwordAgain">
                </div>
                
                <p class="attention" v-if="attention != null">{{ attention }}</p>
                <button type="submit">提交</button>
                <div class="switch" @click="switchAuthMode">{{ loginMode ? '注册' : '登录' }}</div>
            </form>
        </div>

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
                                <span class="time">{{ new Date(msg.time).toLocaleTimeString() }}</span>
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
    export default {
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
                password: null,
                passwordAgain: null,
                attention: null,
                loginMode: true,
                login: false
            }
        },

        methods: {
            submitAuth() {
                if (!this.username || !this.password) {
                    this.attention = '用户信息需要'
                    return
                }

                if (!this.loginMode) {
                    if (this.username.length < 4) {
                        this.attention = '用户名太短啦，要大于4个字符'
                        return
                    }
                    if (this.password.length < 6) {
                        this.attention = '密码太短啦，要大于6个字符'
                        return
                    }
                    if (this.password != this.passwordAgain) {
                        this.attention = '两次密码不一样啊'
                        return
                    }
                }

                let event = this.loginMode ? 'login' : 'signup'
                socket.emit(event, {
                    username: this.username,
                    password: this.password
                })
            },

            switchAuthMode() {
                this.attention = this.username = this.password = this.passwordAgain = null
                this.loginMode = !this.loginMode
            },

            init(socket) {
                this.password = this.passwordAgain = null
                this.login = true

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

                socket.on('channelUsers', (channelUsers) => {
                    this.channelUsers = channelUsers
                })

                window.onbeforeunload = () => {
                    socket.emit('logout')
                }
            },

            loadChatroom(data) {
                let channels = data.joined
                data.channelList.forEach((channel) => {
                    if (channels[channel] === undefined) {
                        channels[channel] = {
                            name: channel,
                            messages: [],
                            joined: false
                        }
                    }
                })

                this.channels = channels
                this.users = data.users

                this.scrollTobottom()
            },

            send() {
                if (this.input == '')
                    return
                /* TODO */
                if (this.at == 'users' && !this.users[this.target].online) {
                    alert('对方已下线，还不支持离线消息')
                    return 
                }

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