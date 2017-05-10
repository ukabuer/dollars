<template>
    <div class="container">
        <load-page class="welcome" v-if="wait"></load-page>

        <welcome-page class="welcome" v-else-if="!login"></welcome-page>

        <main-page v-else></main-page>
    </div>
</template>

<script>
    import {mapState} from 'vuex'
    import loadPage from './pages/load.vue'
    import welcomePage from './pages/welcome.vue'
    import mainPage from './pages/main.vue'
    
    export default {
        components: {
            loadPage, welcomePage, mainPage
        },

        data() {
            return {wait: false}
        },

        computed: mapState({
            login: state => state.login,
            hasInit: state => state.hasInit,
        }),

        methods: {
            init(socket) {
                if (this.hasInit) return

                ['message', 'updateUser', 'join', 'addChannel', 'exit', 'getUsers'].forEach((event) => {
                    socket.on(event, (data) => {
                        this.$store.commit(event, data)
                    })
                })

                window.onunload = window.onpagehide = window.onbeforeunload = () => {
                    socket.emit('logout')
                }
            },
        },

        created() {
            if (window.localStorage.token) {
                this.wait = true
                socket.emit('token', window.localStorage.token)
            }

            socket.on('login succeed', (chatroom) => {
                if (this.wait) this.wait = false
                this.init(socket)
                this.$store.commit('load', chatroom)
            })

            socket.on('login failed', (info) => {
                if (this.wait) this.wait = false
                this.$store.commit('attention', info)
            })

            socket.on('signup failed', (info) => {
                this.$store.commit('attention', info)
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
</style>