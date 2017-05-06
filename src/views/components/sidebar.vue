<template>
    <div class="sidebar">
        <h2>Channels</h2>
        <span v-if="user.isAdmin" @click="addChannel" class="add">+</span>
        <ul class="channels target">
            <li v-for="channel in channels" @click="changeTarget('channels', channel.name)" :class="channel.joined ? 'joined' : ''">
                #{{ channel.name }}
                <span v-if="channel.newMsg > 0">{{ channel.newMsg > 99 ? '99+' : channel.newMsg }}</span>
            </li>
        </ul>

        <h2>Users</h2>
        <ul class="users target">
            <li v-for="item in users" v-if="item.name != user.name" :class="item.online ? 'online' : ''" @click="changeTarget('users', item.name)">
                {{ item.name }}
                <span v-if="item.newMsg > 0">{{ item.newMsg > 99 ? '99+' : item.newMsg}}</span>
            </li>
        </ul>

        <div class="profile">
            <div class="avatar" @click="switchPanel('user')">
                <img v-if="user.avatar" :src="user.avatar">
            </div>
            <div class="panel">
                <p>{{ user.name }}</p>
                <button @click="switchPanel('user')">设置</button>
                <button @click="logout">登出</button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['channels', 'users', 'user', 'changeTarget', 'switchPanel'],
        methods: {
            addChannel() {
               let channel = window.prompt('name')
               socket.emit('addChannel', channel)
            },

            logout() {
                window.localStorage.token = undefined
                socket.emit('logout')
            }
        }
    }
</script>

<style>
    .sidebar {
        position: absolute;
        width: 200px;
        height: 100%;
        padding-left: 20px;
    }

    .sidebar .add {
        position: absolute;
        right: 20px;
        top: 20px;
        font-size: 24px;
        cursor: pointer;
    }

    .sidebar ul {
        height: 30%;
        overflow-y: auto;
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

    .profile {
        position: absolute;
        bottom: 40px;
    }
    
    .profile .avatar {
        margin: 0;
    }

    .profile .panel {
        display: inline-block;
        margin-left: 10px;
    }

    .profile .panel::before {
        content: " ";
        clear: both;
        height: 0;
        display: block;
        visibility: hidden;
    }

    .profile .panel p {
        margin: 0;
        margin-bottom: 10px;
    }
</style>