<template>
    <div class="sidebar">
        <h3>Channels</h3>
        <span v-if="user.isAdmin" @click="addChannel" class="add">+</span>
        <ul class="channels target">
            <li v-for="channel of channels" @click="changeTarget({at: 'channels', target: channel.name})" :class="{joined: channel.joined, current: target == channel.name}">
                #{{ channel.name }}
                <span v-if="channel.newMsg > 0">{{ channel.newMsg > 99 ? '99+' : channel.newMsg}}</span>
            </li>
        </ul>

        <h3>Users</h3>
        <ul class="users target">
            <li v-for="item in users" v-if="item.name != user.name" :class="{online: item.online, current: target == item.name}" @click="changeTarget({at:'users', target: item.name})">
                {{ item.name }}
                <span v-if="item.newMsg > 0">{{ item.newMsg > 99 ? '99+' : item.newMsg}}</span>
            </li>
        </ul>

        <div class="profile">
            <div class="avatar" @click="changePanel('user')">
                <img v-if="user.avatar" :src="user.avatar">
            </div>
            <div class="control">
                <p>{{ user.name }}</p>
                <button class="btn btn-sm" @click="changePanel('user')">设置</button>
                <button class="btn btn-sm" @click="logout">登出</button>
            </div>
        </div>
    </div>
</template>

<script>
    import {mapState, mapMutations} from 'vuex'

    export default {
        computed: mapState({
            channels: state => state.channels,
            users: state => state.users,
            user: state => state.user,
            target: state => state.target,
        }),

        methods: {
            addChannel() {
               let channel = window.prompt('name')
               socket.emit('addChannel', channel)
            },

            logout() {
                window.localStorage.token = null
                socket.emit('logout')
            },
            
            ...mapMutations([
                'changePanel', 'changeTarget'
            ]),
        }
    }
</script>

<style>
    .sidebar {
        position: absolute;
        width: 200px;
        height: 100%;
        padding: 10px 20px 10px 20px;
        background-color: #212121;
        min-height: 500px;
        overflow-y: auto;
        z-index: 1000;
        transition: left 0.3s ease-out;
    }

    .sidebar .add {
        position: absolute;
        right: 20px;
        top: 10px;
        font-size: 24px;
        cursor: pointer;
    }

    .sidebar h3 {
        margin-bottom: 10px;
        border-bottom: 1px solid #fff;
    }

    .sidebar ul {
        margin: 0;
        height: 20%;
        overflow-y: auto;
    }

    .sidebar ul.users {
        height: 40%;
    }

    .channels {
        color: #aaa;
    }
    
    .channels .joined {
        color: #fff;
    }
    
    .target {
        padding: 5px;
    }

    .target li {
        display: block;
        padding: 6px 10px;
        margin: 2px 0;
        line-height: 15px;
        cursor: pointer;
        transition: all .3s ease;
    }

    .target li:hover, .target li.current {
        background-color: #424242;
        transition: all .3s ease;
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

    .users li::before {
        display: inline-block;
        content: "";
        width: 8px;
        height: 8px;
        background-color: #ccc;
        border-radius: 100%
    }

    .users li.online::before {
        background-color: yellowgreen;
    }

    .profile {
        position: absolute;
        bottom: 10px;
    }
    
    .profile .avatar {
        margin: 0;
    }

    .profile .control {
        display: inline-block;
        margin-left: 10px;
    }

    .profile .control::before {
        content: " ";
        clear: both;
        height: 0;
        display: block;
        visibility: hidden;
    }

    .profile .control p {
        margin: 0;
        margin-bottom: 5px;
    }

    .profile .control button {
        margin-right: 10px;
    }
</style>