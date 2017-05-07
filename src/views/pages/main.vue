<template>
    <div class="main">
        <side-bar></side-bar>
        <div class="panel">
            <chat-panel v-if="panel == 'chat'"></chat-panel>
            <user-panel v-else-if="panel == 'user'"></user-panel>
            <channel-panel v-else-if="panel == 'channel'"></channel-panel>
        </div>
    </div>
</template>

<script>
    import {mapState} from 'vuex'
    import sideBar from '../components/sidebar.vue'
    import chatPanel from '../components/chat.vue'
    import userPanel from '../components/user.vue'
    import channelPanel from '../components/channel.vue'

    export default {
        components: {
            sideBar, chatPanel, userPanel, channelPanel
        },

        computed: mapState({
            panel: state => state.panel,
        }),
    }
</script>

<style>
    .panel {
        position: absolute;
        height: 100%;
        left: 200px;
        right: 0px;
        overflow: hidden;
    }
</style>