const chatroom = require('../chatroom')

function allowUser(username) {
    chatroom.allowUsers.push(username)
}

module.exports = allowUser