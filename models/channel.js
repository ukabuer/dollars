let Message = require('./message')

module.exports = Channel

function Channel(name, owner) {
    this.name = name
    this.owner = owner || 'system'

    this.userList = []
    this.messages = []
}

Channel.prototype.addUser = function(username, socket, sockets) {
    socket.join(this.name)
    this.userList.push(username)

    /* emit basic channel info to the user */
    let usersInfo = []
    socket.emit('join', {
        name: this.name,
        messages: this.messages
    })

    /* notificate other users in channel */
    let msg = new Message(`${username}加入了频道`, 'system', this.name, 'channels')
    msg.system = true
    this.messages.push(msg)
    sockets.in(this.name).emit('message', msg)
}

Channel.prototype.removeUser = function(username, socket, sockets) {
    socket.leave(this.name)
    let index = this.userList.indexOf(username)
    this.userList.splice(index, 1)

    /* notificate other users in channel */
    let msg = new Message(`${username}离开了频道`, 'system', this.name, 'channels')
    msg.system = true
    this.messages.push(msg)
    sockets.in(this.name).emit('message', msg)
}

Channel.prototype.addMessage = function (message, socket, sockets) {
    /* push message to all users in channel */
    this.messages.push(message)
    sockets.in(this.name).emit('message', message)
}

Channel.prototype.getUserList = function (socket) {
    socket.emit('channelUsers', this.userList)
}