const crypto = require('crypto')
const chatroom = require('../chatroom')

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
    
    chatroom.login(user, socket)

    return true
}

module.exports = {
    name: 'login',
    type: 'auth',
    fn: login
}