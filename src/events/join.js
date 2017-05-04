const chatroom = require('../chatroom')

function join(channel, socket, io) {
    let user = chatroom.users.get(socket.username)
    user.joined.push(channel)
    chatroom.channels.get(channel).addUser(user.name, socket, io)
}

module.exports = join