<template>
    <div class="container">
        <div class="sidebar">
            <h2>Channels</h2>
            <ul class="channels">
                <li v-for="channel in channels" @click="join(channel.name)">
                    #{{ channel.name }}
                </li>
            </ul>
            <div class="users">
                <ul></ul>
            </div>
        </div>

        <div class="chat">
            <div class="main">
                <div class="messages" id="messages">
                    <div v-for="msg in channels[this.current].messages" :class="msg.user == user ? 'self' : ''">
                        <div class="avatar"></div>
                        <div class="content">
                            <div class="meta">
                                <span>{{ msg.user }}</span>
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
                        newMsg: false
                    }
                },
                input: '',
                current: 'default',
                user: 'test'
            }
        },

        methods: {
            send() {
                socket.emit('message', {
                    user: this.user,
                    content: this.input,
                    channel: this.current
                })
                this.input = ''
            },

            join(channel) {
                this.current = channel
                socket.emit('join', {
                    user: this.user,
                    channel: channel
                })
            }
        },

        created() {
            let user = window.prompt('用户名')
            if (user == '') {
                console.log('用户名需要0 0')
                return
            }
            this.user = user
            socket.emit('initial', user)
            socket.on('initial', (channels) => {
                this.channels = channels
                this.channels['default'].joined = true
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

            socket.on('message', (msg) => {
                let channel = msg.channel
                this.channels[channel].messages.push(msg)
                if (this.current !== channel) {
                    this.channels[channel].newMsg = true
                }
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

            socket.on('join', (channel) => {
                this.$set(this.channels, channel.name, channel)
                this.$nextTick(()=>{
                    $('#messages').scrollTop($('#messages')[0].scrollHeight)
                })
            })

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
    
    .channels li {
        margin: 10px;
    }

    .channels li:hover {
        cursor: pointer;
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
        border-radius: 20px;
        font-size: 16px;
    }



    .main {
        position: absolute;
        padding-top: 70px;
        width: 100%;
        height: 100%;
        bottom: 50px;
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