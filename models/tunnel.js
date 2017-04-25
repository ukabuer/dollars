const fs = require('fs')

module.exports = Tunnel

function Tunnel(large, small, newestFile, lastFile, messages) {
    this.newestFile = newestFile || ''
    this.lastFile = lastFile || ''
    this.messages = messages || []
    this.newMsgs = messages ? messages.length : 0
}

Tunnel.prototype.addMessage = function(message, socket, target) {
    this.messages.push(message)
    socket.to(target).emit('message', message)
    socket.emit('message', message)

    this.newMsgs++
    if (this.newMsgs >= 100) {
        this.writeToFile()
        this.newMsgs = 0
    }

    if (this.messages.length >= 100) {
        this.messages.shift()
    }
}

Tunnel.prototype.writeToFile = function() {
    let filename = `${Date.now()}.json`
    var data = {
        lastFile: this.newestFile,
        messages: this.messages
    }

    fs.writeFile(`./data/users/${this.large}/${this.small}/${filename}`, JSON.stringify(data), (err) => {
        if (err) {
            console.log(err)
        }
    })
    this.lastFile = newestFile
    this.newestFile = filename
}