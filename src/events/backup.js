const chatroom = require('../chatroom')

function backup() {
    chatroom.backup()
}

module.exports = {
    name: 'backup',
    type: 'admin',
    fn: backup
}