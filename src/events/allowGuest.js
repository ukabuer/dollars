const chatroom = require('../chatroom')

function allowGuest(username) {
    chatroom.public = true
}

module.exports = allowGuest