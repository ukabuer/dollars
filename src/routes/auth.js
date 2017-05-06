const crypto = require('crypto')
const chatroom = require('../chatroom')
const User = require('../models/user')

const colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']

function login(data, socket, io) {
    if (!data.username || !data.password) {
        socket.emit('login failed', `需要用户信息`)
        return false
    }

    let user = chatroom.users.get(data.username)
    if (undefined === user) {
        socket.emit('login failed', `${data.username}？不存在的`)
        return false
    }
    
    let hash = crypto.createHash('sha256')
    hash.update(data.password)
    if (hash.digest('hex') != user.password) {
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

function loginWithToken(username, socket, io) {
    let user = chatroom.users.get(username)
    if (undefined === user || user.socket != null) {
        return false
    }

    if (user.admin) socket.admin = true

    sendChatroomData(user, socket)

    return true
}

function signup(data, socket, io) {
    if (!data.username || !data.password) {
        socket.emit('signup failed', '需要用户信息')
        return false
    }
    if (/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(data.username)) {
        socket.emit('signup failed', '用户名包含特殊字符')
        return false
    }
    if (data.username.length < 2 || data.password.length < 6) {
        socket.emit('signup failed', '用户名或者密码太短')
        return false
    }
    if (chatroom.users.has(data.username)) {
        socket.emit('signup failed', '用户已经存在')
        return false
    }
    if (!chatroom.public && chatroom.allowUsers.indexOf(data.username) == -1) {
        socket.emit('signup failed', '此用户名还未拥有注册的权利')
        return false
    }
    
    let hash = crypto.createHash('sha256')
    hash.update(data.password)
    let user = new User(data.username, hash.digest('hex'))

    if (chatroom.admins.indexOf(user.name) != -1) {
        socket.admin = user.admin = true
    }
    
    user.joined.push(chatroom.default)

    chatroom.users.set(user.name, user)
    chatroom.saveUsers()
    chatroom.tunnels.set(user.name, new Map())

    sendChatroomData(user, socket)

    chatroom.channels.get(chatroom.default).addUser(user.name, socket, io)
    return true
}

function sendChatroomData(user, socket) {

    user.socket = socket.id
    socket.color = colors[Math.floor(Math.random() * colors.length)]
    socket.username = user.name

    /* send user the chatroom info */
    let data = {
        user: {
            name: user.name,
            isAdmin: user.admin,
            avatar: user.avatar
        },
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
            avatar: user.avatar
        }
    })
    socket.emit('login succeed', data)
    socket.to(chatroom.default).emit('login', user.name)
}

function logout(socket, io) {
    if (!socket.username) return false
    let user = chatroom.users.get(socket.username)
    if (!user) return false

    socket.emit('exit', '登出成功')

    socket.disconnect(false)
    user.socket = null
    user.lastLogoutTime = Date.now()
    io.to('default').emit('logout', user.name)
    return true
}

module.exports = {
    login,
    loginWithToken,
    signup,
    logout,
}