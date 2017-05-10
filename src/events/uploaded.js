const chatroom = require('../chatroom')

function uploaded(filepath, socket, io) {
    let user = chatroom.users.get(socket.username)
    if (!user) return false
    user.avatar = filepath
    io.in(chatroom.default).emit('updateUser', {
        name: user.name, 
        isAdmin: user.isAdmin,
        online: user.online,
        avatar: user.avatar
    })
    return true
}

module.exports = {
    name: 'uploaded',
    type: 'normal',
    fn: uploaded
}