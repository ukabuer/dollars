const chatroom = require('../chatroom')

function leave(channel, socket, io) {
    if (channel == 'default') return;
    let user = chatroom.users.get(socket.username)
    let index = user.joined.indexOf(channel)
    user.joined.splice(index, 1)
    chatroom.channels.get(channel).removeUser(user.name, socket, io)
}

module.exports = leave