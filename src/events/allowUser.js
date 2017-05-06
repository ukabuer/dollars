const chatroom = require('../chatroom')

function allowUser(username) {
    chatroom.allowUsers.push(username)
}

module.exports = {
    name: 'allowUser',
    type: 'admin',
    fn: allowUser
}