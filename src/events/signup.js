const crypto = require('crypto')

const User = require('../models/user')
const chatroom = require('../chatroom')
const login = require('./login')

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
    
    const hash = crypto.createHash('sha256')
    hash.update(data.password)

    let user = new User(data.username, hash.digest('hex'))
    if (chatroom.admins.indexOf(user.name) != -1) socket.admin = user.admin = true
    user.joined.push(chatroom.defaultChannel)

    chatroom.users.set(user.name, user)
    chatroom.saveUsers()
    chatroom.tunnels.set(user.name, new Map())

    login(data, socket, io)

    chatroom.channels.get(chatroom.defaultChannel).addUser(user.name, socket, io)
    return true
}

module.exports = signup