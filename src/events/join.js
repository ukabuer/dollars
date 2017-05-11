const chatroom = require('../chatroom')

function join(channelName, socket, io) {
    let user = chatroom.users.get(socket.username)
    let channel = chatroom.channels.get(channelName)
    if (!user || !channel) return

    user.joined.push(channelName)
    channel.addUser(user.name, socket, io)
}

module.exports = {
    name: 'join',
    type: 'normal',
    fn: join
}