const jwt = require('jsonwebtoken')
const chatroom = require('../chatroom')

function token(data, socket, io) {
    try {
        let decoded = jwt.verify(data, chatroom.secret, { maxAge: 24 * 60 * 60 })
        if (!decoded.name) throw new Error()

        let user = chatroom.users.get(decoded.name)
        if (!user || user.socket != null) throw new Error()

        chatroom.login(user, socket)
        
        return true
    } catch(e) {
        socket.emit('login failed')
        return false
    }
}

module.exports = {
    name: 'token',
    type: 'auth',
    fn: token
}