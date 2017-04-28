const fs = require('fs')

module.exports = Tunnel

function Tunnel(begin, end, lastFile, messages) {
    this.begin = begin
    this.end = end
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

Tunnel.prototype.writeToFile = function(sync = false) {
    let filename = `${Date.now()}.json`
    var data = {
        lastFile: this.lastFile,
        messages: this.messages
    }

    if (sync) {
        data.messages = data.messages.slice(-this.newMsgs)
        fs.writeFileSync(`./data/users/${this.begin}/${this.end}/${filename}`, data)
        fs.writeFileSync(`./data/users/${this.begin}/${this.end}/tunnel.json`, filename)
    } else {
        fs.writeFile(`./data/users/${this.begin}/${this.end}/${filename}`, JSON.stringify(data), (err) => {
            if (err) {
                console.log(err)
            }
        })
        fs.writeFile(`./data/users/${this.begin}/${this.end}/tunnel.json`, filename, (err) => {
            if (err) {
                console.log(err)
            }
        })
    }

    this.lastFile = filename
}