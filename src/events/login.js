const crypto = require('crypto')
const chatroom = require('../chatroom')

const colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']

function login(data, socket, io) {
    if (!data.username || !data.password) {
        socket.emit('login failed', `需要用户信息`)
        return false
    }

    const hash = crypto.createHash('sha256')
    hash.update(data.password)

    let user = chatroom.users.get(data.username)
    if (undefined === user) {
        socket.emit('login failed', `${data.username}？不存在的`)
        return false
    } else if (hash.digest('hex') != user.password) {
        socket.emit('login failed', '密码错误')
        return false
    }

    if (user.socket != null) {
        socket.to(user.socket).emit('exit', '本账号在另一处登录了')
    }

    if (user.admin) socket.admin = true
    
    sendChatroomData(user, socket)

    return true
}

function sendChatroomData(user, socket) {
    user.socket = socket.id
    socket.color = colors[Math.floor(Math.random() * colors.length)]
    socket.username = user.name

    /* send user the chatroom info */
    let data = {
        username: user.name,
        admin: user.admin,
        channelList: [],
        joined: {},
        users: {},
        offlineMsgs: user.offlineMsgs,
        lastLogoutTime: user.lastLogoutTime
    }
    chatroom.channels.forEach((channel, name) => {
        data.channelList.push(name)
    })
    user.joined.forEach((channel) => {
        socket.join(channel)
        data.joined[channel] = {
            name: channel,
            messages: chatroom.channels.get(channel).messages,
            joined: true
        }
    })

    let username = socket.username
    chatroom.users.forEach((user) => {
        let begin, end
        [begin, end] = username > user.name ? [username, user.name] : [user.name, username]
        let tmp = chatroom.tunnels.get(begin).get(end)
        data.users[user.name] = {
            name: user.name,
            online: user.socket != null,
            messages: tmp == undefined ? [] : tmp.messages,
        }
    })
    socket.emit('login succeed', data)
    socket.to(chatroom.defaultChannel).emit('login', user.name)
}

module.exports = login