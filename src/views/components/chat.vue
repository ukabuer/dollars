<template>
    <div>
        <div class="chat-header">
            <h3>{{ target }}</h3>
            <div class="control" v-if="at == 'channels'">
                <span @click="getChannelUsers">频道成员</span>
                <span v-if="target != 'default'" @click="leave">离开频道</span>
            </div>
        </div>

        <div class="messages" id="messages">
            <div v-for="msg in messages" :class="msg.from == username ? 'self' :''">
                <div v-if="!msg.system" class="avatar">
                    <img v-if="users[msg.from].avatar" :src="users[msg.from].avatar">
                </div>
                <div :class="'content' + (msg.system ? ' system' : '')">
                    <div class="meta">
                        <span v-if="!msg.system">{{ msg.from }}</span>
                        <span class="time">{{ displayTime(msg.time) }}</span>
                    </div>
                    <p :style="msg.system ? '' :'background-color:'+msg.color">{{ msg.content }}</p>
                </div>
            </div>
        </div>

        <input-bar :target="target" :at="at"></input-bar>
    </div>
</template>

<script>
    import { mapState, mapMutations, mapGetters } from 'vuex'
    import inputBar from './input-bar.vue'

    export default {
        components: {
            inputBar
        },

        computed: mapState({
            ...mapGetters(['messages']),
            at: state => state.at,
            target: state => state.target,
            users: state => state.users,
            username: state => state.user.name,
        }),

        methods: {
            ...mapMutations(['changePanel', 'leave']),

            getChannelUsers() {
                socket.emit('getUsers', this.target)
                this.changePanel('channel')
            },

            displayTime(time) {
                let date = new Date(time)
                let today = new Date()
                let basic = date.toTimeString().substr(0, 8)

                if (today.getDate() == date.getDate()) return basic

                basic = (date.getMonth() + 1) + '/' + date.getDate() + ' ' + basic
                if (today.getFullYear() == date.getFullYear()) return basic

                return date.getFullYear() + '/' + basic
            },

            scrollToBottom() {
                this.$nextTick(() => {
                    let messageBox = document.querySelector('#messages')
                    messageBox.scrollTop = messageBox.scrollHeight
                })
            },
        },

        watch: {
            messages() {
                this.scrollToBottom()
            }
        },

        created() {
            this.scrollToBottom()
        }
    }

</script>

<style>
    .chat-header {
        height: 50px;
    }

    .chat-header h3 {
        margin: 0;
        margin-bottom: 1rem;
        text-align: center;
        line-height: 50px
    }

    .chat-header .control {
        position: absolute;
        top: 25px;
        right: 10px;
        color: #ccc;
    }

    .chat-header .control span {
        margin-right: 10px;
        cursor: pointer;
        transition: color .5s ease;
    }

    .chat-header .control span:hover {
        color: #fff;
        transition: color .3s ease;
    }

    .messages {
        position: absolute;
        width: 100%;
        top: 50px;
        bottom: 80px;
        padding-top: 10px;
        border-top: 1px solid #333;
        overflow-y: auto;
    }

    .messages > div {
        margin-bottom: 10px;
    }

    .messages .self .avatar {
        float: right;
    }

    .messages .self .content {
        text-align: right;
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

    .time {
        font-size: 12px;
        color: #ddd;
        margin: 0 5px;
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
        white-space: pre-wrap;
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

    @media (max-width: 600px) {
        .content p {
            padding: 5px 15px;
            font-size: 14px;
        }
    }
</style>