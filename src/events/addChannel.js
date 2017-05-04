const fs = require('fs')
const chatroom = require('../chatroom')
const Channel = require('../models/channel')

function addChannel(channel, socket, io) {
    chatroom.channels.set(channel, new Channel(channel))
    io.in('default').emit('addChannel', channel)
    fs.mkdir(`./data/channels/${channel}`, (err) => {})
}

module.exports = addChannel