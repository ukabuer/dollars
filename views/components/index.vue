<template>
    <div class="container">
        <div class="sidebar">
            <h2>Channels</h2>
            <ul class="channels target">
                <li v-for="channel in channels" @click="changeTarget('channels', channel.name)" :class="channel.joined ? 'joined' : ''">
                    #{{ channel.name }} 
                    <span v-if="channel.newMsg > 0">{{ channel.newMsg > 99 ? 99 : channel.newMsg }}</span>
                </li>
            </ul>
            <h2>Online</h2>
            <ul class="users target">
                <li v-for="user in users" @click="changeTarget('users', user.name)">
                    {{ user.name }}
                    <span v-if="user.newMsg > 0">{{ user.newMsg > 99 ? 99 : user.newMsg}}</span>
                </li>
            </ul>
        </div>

        <div class="chat">
            <div class="main">
                <h1>{{ target }}</h1>
                <div class="messages" id="messages">
                    <div v-for="msg in this[type][target].messages" :class="msg.from == user ? 'self' : ''">
                        <div v-if="!msg.system" class="avatar"></div>
                        <div :class="'content' + (msg.system ? ' system' : '')">
                            <div class="meta">
                                <span v-if="!msg.system">{{ msg.from }}</span>
                                <span class="time">{{ new Date(msg.time).toLocaleTimeString() }}</span>
                            </div>
                            <p>{{ msg.content }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <form @submit.prevent="send">
                <input v-model="input" autocomplete="off" />
                <button>Send</button>
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
                        users: [],
                        messages: [],
                        joined: false,
                        newMsg: 0
                    }
                },
                users: {},
                input: '',
                target: 'default',
                type: 'channels',
                user: ''
            }
        },

        methods: {
            send() {
                if (this.input == '')
                    return
                socket.emit('message', {
                    content: this.input,
                    type: this.type,
                    target: this.target
                })
                this.input = ''
            },

            changeTarget(type, target) {
                this.type = type
                this.target = target
                if (type == 'channels' && this[type][target].joined != true) {
                    socket.emit('join', target)
                } else {
                    this[type][target].newMsg = 0
                    this.$nextTick(()=>{
                        $('#messages').scrollTop($('#messages')[0].scrollHeight)
                    })
                }
            }
        },

        created() {
            let user = window.prompt('用户名')
            if (!user || user == '') {
                alert('用户名 需要！')
                return
            }
            this.user = user

            socket.emit('login', user)
            socket.on('login', (channels) => {
                channels['default'].joined = true
                channels['default'].newMsg = 0
                this.channels = channels
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })

                channels['default'].users.forEach(user => {
                    let tmp = Object.assign({}, user)
                    tmp.newMsg = 0
                    tmp.messages = []
                    this.$set(this.users, user.name, tmp)
                })
            })

            socket.on('message', (msg) => {
                let target = msg.target
                let type = msg.type
                if (type == 'users') {
                    target = (target == this.user) ? msg.from : target
                }
                
                this[type][target].messages.push(msg)

                if (this.target !== msg.target) {
                    let tmp = Object.assign({}, this[type][target])
                    tmp.newMsg++
                    this.$set(this[type], target, tmp)
                }
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

            socket.on('join', (data) => {
                if (data.messages === undefined) {
                    let tmp = this.channels[data.channel]
                    tmp.users.push(data.user)
                    tmp.messages.push({
                        channel: data.channel,
                        system: true,
                        time: Date.now(),
                        content: data.user.name+'进入了本频道'
                    })
                    this.$set(this.channels, data.channel, tmp)

                    tmp = Object.assign({}, data.user)
                    tmp.messages = []
                    tmp.newMsg = 0
                    this.$set(this.users, tmp.name, tmp)
                } else {
                    data.joined = true
                    data.newMsg = 0
                    this.$set(this.channels, data.name, data)
                }
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

            socket.on('exit', (data) => {
                let channel = data.channel
                let tmp = this.channels[channel]
                let i = tmp.users.indexOf(data.user)
                tmp.users.splice(i, 1)
                delete this.users[data.user.name]
                tmp.messages.push({
                    channel: data.channel,
                    system: true,
                    time: Date.now(),
                    content: data.user.name+'离开了本频道'
                })
                this.$set(this.channels, channel, tmp)
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

            window.onbeforeunload = () => {
                socket.emit('exit')
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
    
    .sidebar {
        position: absolute;
        width: 200px;
        height: 100%;
    }

    .channels {
        color: #bbb;
    }

    .channels .joined {
        color: #fff;
    }

    .target li {
        margin: 10px;
        line-height: 20px;
    }

    .target li:hover {
        cursor: pointer;
    }

    .target li span {
        display: inline-block;
        width: 20px;
        height: 20px;
        border-radius: 100%;
        font-size: 12px;
        text-align: center;
        background-color: orangered;
    }

    .chat {
        position: absolute;
        height: 100%;
        left: 200px;
        right: 0px;
        padding: 10 0px;
        overflow: hidden;
    }

    .time {
        font-size: 12px;
        color: #ddd;
    }

    .avatar {
        float: left;
        width: 50px;
        height: 50px;
        border: 2px solid #fff;
        border-radius: 100%;
        margin: 0 20px;
    }
    
    .content p {
        display: inline-block;
        margin-top: 5px;
        padding: 10px 25px;
        background-color: yellowgreen;
        border: 2px solid #fff;
        border-radius: 10px;
        font-size: 16px;
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
        overflow-y: scroll;
    }

    .messages > div {
        margin-bottom: 40px;
    }

    .messages .self .avatar {
        float: right;
    }
    
    .messages .self .content {
        text-align: right;
    }

    form {
        position: absolute;
        bottom: 0;
        height: 40px;
        width: 100%;
    }
    
    form input {
        height: 100%;
        border: 0;
        padding: 10px;
        width: 90%;
    }
    
    form button {
        height: 100%;
        width: 9%;
        background: rgb(130, 224, 255);
        border: none;
        padding: 5px;
    }
</style>