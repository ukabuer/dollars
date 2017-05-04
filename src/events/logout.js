const chatroom = require('../chatroom')

function logout(data, socket, io) {
    if (!socket.username) return

    let user = chatroom.users.get(socket.username)
    socket.disconnect(true)

    user.socket = null
    user.lastLogoutTime = Date.now()
    io.to('default').emit('logout', user.name)
}

module.exports = logout