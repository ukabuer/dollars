<template>
    <div class="channel">
        <h2>{{ target }}</h2>
        <ul class="users">
            <li v-for="user in channelUsers">
                {{ user }}
            </li>
        </ul>
        <span class="close" @click="changePanel('chat')">X</span>
    </div>
</template>

<script>
    import {mapState, mapMutations} from 'vuex'

    export default {
        data() {
            return { channelUsers: [] }
        },

        computed: mapState({
            hasInit: state => state.hasInit,
            target: state => state.target,
        }),

        methods: {
            ...mapMutations(['changePanel']),
        },

        created() {
            if (hasInit) return 

            socket.on('getUsers', (channelUsers) => {
                this.channelUsers = channelUsers
            })
        }
    }
</script>

<style>
    .channel {
        text-align: center;
    }
    
    .channel ul {
        margin: 20% auto;
        width: 200px;
    }
</style>
