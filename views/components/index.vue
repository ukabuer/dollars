<template>
    <div class="container">
        <ul class="channels">
            <li v-for="{_, channel} in channels" @click="join(channel)">
                {{ channel }}
            </li>
        </ul>
        <ul id="messages">
            <li v-for="msg in channels[current].messages">
                {{ msg.user }} - {{ msg.time }} : {{ msg.content }}
            </li>
        </ul>
        <form @submit.prevent="send">
            <input v-model="input" autocomplete="off" /><button @click="send">Send</button>
        </form>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                channels: {
                    'default': {
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
                    channel: current
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
            socket.emit('connect', this.user)
            socket.on('connect', (channels) => {
                this.channels = channels
                this.channels['default'].joined = true
            })

            socket.on('message', (msg) => {
                let channel = msg.channel
                this.channels[channel].messages.push(msg.content)
                if (this.current !== channel) {
                    this.channels[channel].newMsg = true
                }
            })

            socket.on('join', (channel) => {
                this.channels[channel] = channel
            })

        }
    }
</script>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font: 13px Helvetica, Arial;
    }
    
    form {
        background: #000;
        padding: 3px;
        position: fixed;
        bottom: 0;
        width: 100%;
    }
    
    form input {
        border: 0;
        padding: 10px;
        width: 90%;
        margin-right: .5%;
    }
    
    form button {
        width: 9%;
        background: rgb(130, 224, 255);
        border: none;
        padding: 10px;
    }
    
    #messages {
        list-style-type: none;
        margin: 0;
        padding: 0;
    }
    
    #messages li {
        padding: 5px 10px;
    }
    
    #messages li:nth-child(odd) {
        background: #eee;
    }
</style>