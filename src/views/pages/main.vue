<template>
    <div class="main">
        <side-bar :class="{display}"></side-bar>
        <div id="menu" @click="display = true">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div id="panel" @click="display = false">
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
        data() {
            return {
                display: false
            }
        },

        components: {
            sideBar, chatPanel, userPanel, channelPanel
        },

        computed: mapState({
            panel: state => state.panel,
        }),

        methods: {
            openSideBar() { this.display = true },
            closeSideBar() { this.display = false }
        }
    }
</script>

<style>
    #panel {
        position: absolute;
        height: 100%;
        left: 200px;
        right: 0px;
        overflow: hidden;
        min-height: 500px;        
    }

    #menu {
        position: absolute;
        display: none;
        top: 15px;
        left: 10px;
        cursor: pointer;
        z-index: 100;
    }

    #menu span {
        position: relative;
        display: block;
        height: 3px;
        width: 30px;
        margin-bottom: 5px; 
        background-color: #fff;
    }

    #menu::after {
        top: 7px;
    }

    .sidebar.display {
        left: 0px!important;
        z-index: 1000;
        transition: left 0.3s ease-out;
    }

    @media (max-width: 600px) {
        .sidebar {
            left: -200px;
        }

        #panel {
            left: 0px;
        }

        #menu {
            display: inline-block;
        }
    }
</style>