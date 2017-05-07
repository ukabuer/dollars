import Vue from 'vue'
import Vuex from 'vuex'

import mutations from './mutations'
import getters from './getters'

Vue.use(Vuex)

const state = {
    channels: {},
    users: {},
    user: {
        name: null,
        isAdmin: false,
        avatar: null,
    },
    panel: 'chat',
    target: 'default',
    at: 'channels',
    login: false,
    hasInit: false,
    attention: null,
}

export default new Vuex.Store({
    state,
    getters,
    mutations,
})