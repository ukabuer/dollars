const chatroom = require('../chatroom')

function getUsers(channelName, socket, io) {
    let channel = chatroom.channels.get(channelName)
    if (channel) {
        channel.getUserList(socket)
    }
}

module.exports = {
    name: 'getUsers',
    type: 'normal',
    fn: getUsers
}