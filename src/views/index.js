import Vue from 'vue'
import Vuex from 'vuex'

import index from './index.vue'
import store from './store'

Vue.use(Vuex)

const app = new Vue({
    el: '#app',
    store,
    render: h => h(index)
})