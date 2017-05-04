const chatroom = require('../chatroom')

function forbidGuest(username) {
    chatroom.public = false
    chatroom.allowUsers = []
}

module.exports = forbidGuest