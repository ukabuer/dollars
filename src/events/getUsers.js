const chatroom = require('../chatroom')

function channelUsers(channelm, socket, io) {
    chatroom.channels.get(channel).getUserList(socket)
}

module.exports = channelUsers