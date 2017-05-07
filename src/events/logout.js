const chatroom = require('../chatroom')

function logout(data, socket, io) {
    if (!socket.username) return

    let user = chatroom.users.get(socket.username)
    if (!user) return 
    
    socket.emit('exit', '登出成功')
    socket.disconnect(false)
    user.socket = null
    user.lastLogoutTime = Date.now()
    io.to(chatroom.default).emit('updateUser', {
        name: user.name, 
        isAdmin: user.isAdmin,
        online: user.socket != null,
        avatar: user.avatar
    })
}

module.exports = {
    name: 'logout',
    type: 'normal',
    fn: logout
}