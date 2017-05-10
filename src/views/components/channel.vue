<template>
    <div class="channel">
        <h2>{{ target }}</h2>
        <ul class="users">
            <li v-for="user in channelUsers" :class="users[user].online ? 'online' : ''">
                {{ user }}
            </li>
        </ul>
        <span class="close" @click="changePanel('chat')">X</span>
    </div>
</template>

<script>
    import {mapState, mapMutations} from 'vuex'

    export default {
        computed: mapState({
            target: state => state.target,
            channelUsers: state => state.channelUsers,
            users: state => state.users,
        }),

        methods: {
            ...mapMutations(['changePanel']),
        },
    }
</script>

<style>
    .channel {
        text-align: center;
    }
    
    .channel ul {
        margin: 20px auto;
        padding: 0;
        width: 200px;
    }

    .channel ul li {
        display: block;
        margin: 10px;
    }
</style>
