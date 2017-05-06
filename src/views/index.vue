<template>
    <div class="container">
        <welcome class="welcome" v-if="!login" :hasInit="hasInit" :attention="attention"></welcome>

        <sidebar v-if="login" :channels="channels" :users="users" :user="user" :changeTarget="changeTarget" :switchPanel="switchPanel"></sidebar>

        <div class="main" v-if="login">
            <chatpanel v-if="panel == 'chat'" :at="at" :target="target" :username="user.name" :messages="this[at][target].messages" :users="users" :leave="leave"></chatpanel>

            <userpanel v-else-if="panel == 'user'" :user="user" :switchPanel="switchPanel"></userpanel>
        </div>
    </div>
</template>

<script>
    import welcome from './components/welcome.vue'
    import sidebar from './components/sidebar.vue'
    import chatpanel from './components/chat.vue'
    import userpanel from './components/user.vue'
    
    export default {
        components: {
            welcome, chatpanel, userpanel, sidebar
        },
        
        data() {
            return {
                channels: {},
                users: {},
                target: 'default',
                at: 'channels',
                panel: 'chat',
                user: {
                    name: null,
                    isAdmin: false,
                    avatar: null,
                },
                login: false,
                hasInit: false,
                attention: null,
            }
        },

        methods: {
            init(socket) {
                this.login = true
                if (this.hasInit) return
                this.hasInit = true

                socket.on('message', (message) => {
                    this.recieve(message)
                })

                socket.on('login', (username) => {
                    this.updateUser(username, 'online', true)
                })

                socket.on('logout', (username) => {
                    this.updateUser(username, 'online', false)
                })

                socket.on('update', (data) => {
                    this.updateUser(data.username, 'avatar', data.avatar)
                })

                socket.on('join', (channel) => {
                    this.joinChannel(channel)
                })

                socket.on('getUsers', (channelUsers) => {
                    this.channelUsers = channelUsers
                })

                socket.on('addChannel', (channel) => {
                    this.$set(this.channels, channel, {
                        name: channel,
                        messages: [],
                        joined: false
                    })
                })

                socket.on('exit', (info) => {
                    this.login = false
                    this.attention = info
                    socket.open()
                })

                window.onunload = window.onpagehide = window.onbeforeunload = () => {
                    socket.emit('logout')
                }
            },

            loadChatroom(data) {
                window.localStorage.token = data.token
                this.user = data.user
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
                        if (null != data.lastLogoutTime) {
                            channels[channel].messages.forEach((message) => {
                                if (message.time > data.lastLogoutTime) {
                                    newMsg++
                                }
                            })
                        }
                        channels[channel].newMsg = newMsg
                    }
                })

                this.channels = channels
                this.users = data.users
                for (let user in data.offlineMsgs) {
                    this.users[user].newMsg = data.offlineMsgs[user]
                }
                this.scrollToBottom()
            },

            recieve(message) {
                let target = message.to, at = message.at
                if (at == 'users' && target == this.user.name) {
                    target = message.from
                }

                this[at][target].messages.push(message)

                if (this.panel != 'chat' || this.target != target) {
                    let tmp = Object.assign({}, this[at][target])
                    if (tmp.newMsg === undefined)
                        tmp.newMsg = 0
                    tmp.newMsg++
                    this.$set(this[at], target, tmp)
                } else {
                    this.scrollToBottom()
                }
            },

            changeTarget(at, target) {
                if (this.panel != 'chat') {
                    this.panel = 'chat'
                    this.$nextTick(() => {
                        this.changeTarget(at, target)
                    })
                    return
                }
                this.at = at
                if (!target) return
                this.target = target
                if (at == 'channels' && this[at][target].joined != true) {
                    socket.emit('join', target)
                } else {
                    this[at][target].newMsg = 0
                    this.scrollToBottom()
                }
            },

            switchPanel(panel) {
                this.panel = panel
            },

            leave() {
                let channel = Object.assign({}, this.channels[this.target])
                channel.joined = false
                this.$set(this.channels, this.target, channel)
                socket.emit('leave', this.target)

                this.changeTarget('channels', 'default')
            },

            updateUser(username, attribute, value) {
                if (username == this.user.name) {
                    this.$set(this.user, attribute, value)
                }
                let user = this.users[username]
                if (undefined == user) {
                    user = {
                        name: username,
                        online: true,
                        avatar: null,
                        messages: []
                    }
                } else {
                    user = Object.assign({}, user)
                    user[attribute] = value
                }
                this.$set(this.users, username, user)
                if (attribute == 'online' && value == false && this.target == username) {
                    this.recieve({
                        content: username + '下线了',
                        from: username,
                        to: this.user.name,
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

            scrollToBottom() {
                this.$nextTick(() => {
                    let messageBox = document.querySelector('#messages')
                    messageBox.scrollTop = messageBox.scrollHeight
                })
            },
        },

        created() {
            socket.on('login succeed', (chatroom) => {
                this.init(socket)
                this.loadChatroom(chatroom)
            })
            if (window.localStorage.token) socket.emit('token', window.localStorage.token)       
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
    
    .main {
        position: absolute;
        height: 100%;
        left: 200px;
        right: 0px;
        overflow: hidden;
    }
</style>