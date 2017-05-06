const chatroom = require('../chatroom')

function allowGuest(username) {
    chatroom.public = true
}

module.exports = {
    name: 'allowGuest',
    type: 'admin',
    fn: allowGuest
}