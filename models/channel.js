const fs = require('fs')
const Message = require('./message')

module.exports = Channel

function Channel(name, owners, public, usernames, newestFile, lastFile, messages) {
    this.name = name
    this.owners = owners || []
    this.public = public || true
    this.newestFile = newestFile || ''
    this.usernames = usernames || []
    this.messages = messages || []
    this.lastFile = lastFile || ''
    this.newMsgs = messages ? messages.length : 0
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
    this.addMessage(msg, socket, sockets)
}

Channel.prototype.removeUser = function(username, socket, sockets) {
    socket.leave(this.name)
    let index = this.userList.indexOf(username)
    this.userList.splice(index, 1)

    /* notificate other users in channel */
    let msg = new Message(`${username}离开了频道`, 'system', this.name, 'channels')
    msg.system = true
    this.addMessage(msg, socket, sockets)
}

Channel.prototype.addMessage = function(message, socket, sockets) {
    /* push message to all users in channel */
    this.messages.push(message)
    sockets.in(this.name).emit('message', message)
    
    this.newMsgs++
    if (this.newMsgs >= 100) {
        this.writeToFile()
        this.newMsgs = 0
    }

    if (this.messages.length >= 100) {
        this.messages.shift()
    }
}

Channel.prototype.getUserList = function(socket) {
    socket.emit('channelUsers', this.usernames)
}

Channel.prototype.writeToFile = function(sync = false) {
    let filename = `${Date.now()}.json`
    var data = {
        lastFile: this.newestFile,
        messages: this.messages
    }
    if (sync) {
        fs.writeFileSync(`./data/channels/${this.name}/${filename}`, JSON.stringify(data))
    } else {
        fs.writeFile(`./data/channels/${this.name}/${filename}`, JSON.stringify(data), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
    this.lastFile = this.newestFile
    this.newestFile = filename
}