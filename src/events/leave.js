const chatroom = require('../chatroom')

function leave(channelName, socket, io) {
    if (channelName == chatroom.default) return
    let user = chatroom.users.get(socket.username)
    let channel = chatroom.channels.get(channelName)
    if (!user || !channel) return 

    let index = user.joined.indexOf(channel)
    user.joined.splice(index, 1)
    channel.removeUser(user.name, socket, io)
}

module.exports = {
    name: 'leave',
    type: 'normal',
    fn: leave
}