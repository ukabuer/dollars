function message(state, message) {
    let target = message.to, at = message.at
    if (at == 'users' && target == state.user.name) {
        target = message.from
    }

    state[at][target].messages.push(message)

    if (state.panel != 'chat' || state.target != target) {
        if (state[at][target].newMsg === undefined) {
            state[at][target].newMsg = 0
        } else {
            state[at][target].newMsg++
        }
    }
}

function changePanel(state, panel) {
    state.panel = panel
}

function changeTarget(state, payload) {
    let at = payload.at
    let target = payload.target
    if (state.panel != 'chat') {
        changePanel(state, 'chat')
    }

    state.at = at
    state.target = target

    if (state.at == 'channels' && state[at][target].joined != true) {
        socket.emit('join', target)
    } else {
        state[state.at][state.target].newMsg = 0
    }
}

export default {
    load(state, data) {
        window.localStorage.token = data.token

        state.hasInit = true
        state.login = true
        state.user = data.user

        let channels = data.joined
        data.channelList.forEach((channel) => {
            if (undefined == channels[channel]) {
                channels[channel] = {
                    name: channel,
                    messages: [],
                    joined: false
                }
            } else {
                let newMsg = 0
                if (null != data.lastLogoutTime) {
                    channels[channel].messages.forEach((message) => {
                        if (message.time > data.lastLogoutTime) {
                            newMsg++
                        }
                    })
                }
                channels[channel].newMsg = newMsg
            }
        })

        state.channels = channels
        state.users = data.users
        for (let user in data.offlineMsgs) {
            state.users[user].newMsg = data.offlineMsgs[user]
        }
    },

    changePanel,

    changeTarget,

    addChannel(state, channel) {
        state.channels = {
            ...state.channel,
            [channel]: {
                name: channel,
                joined: false,
                messages: []
            }
        }
    },

    message,

    leave(state) {
        state.channels[state.target].joined = false
        socket.emit('leave', state.target)

        changeTarget(state, { at: 'channels', target: 'default' })
    },

    updateUser(state, user) {
        if (user.name == state.user.name) {
            state.user.isAdmin = user.isAdmin
            state.user.avatar = user.avatar
        }

        let exist = state.users[user.name]

        if (undefined == exist) {
            state.users = {
                ...state.users,
                [user.name]: { ...user, messages: [] }
            }
        } else {
            if (exist.online == true && user.online == false && state.target == user.name) {
                message(state, {
                    content: user.name + '下线了',
                    from: user.name,
                    to: state.user.name,
                    at: 'users',
                    time: Date.now(),
                    system: true
                })
            }
            state.users[user.name] = Object.assign(exist, user)
        }
    },

    join(state, channel) {
        channel.joined = true
        channel.newMsg = 0
        state.channels[channel.name] = channel
    },

    exit(state, info) {
        state.login = false
        state.attention = info
    },

    attention(state, info) {
        state.attention = info
    },

    getUsers(state, users) {
        state.channelUsers = users
    }
}