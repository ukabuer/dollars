const fs = require('fs')

const MAXMSG = 100

class Tunnel {
    constructor(begin, end, lastFile, messages) {
        this.begin = begin
        this.end = end
        this.lastFile = lastFile || ''

        this.messages = messages || []
        this.newMsgs = messages ? messages.length : 0
    }

    addMessage(message, socket, target) {
        this.messages.push(message)
        if (null != target) {
            socket.to(target).emit('message', message)
        }
        socket.emit('message', message)

        this.newMsgs++
        if (this.newMsgs >= MAXMSG) {
            this.writeToFile()
            this.newMsgs = 0
        }

        if (this.messages.length >= MAXMSG) {
            this.messages.shift()
        }
    }

    writeToFile() {
        let data = {
            lastFile: this.lastFile,
            messages: this.messages
        }
        let filename = ''

        if (this.newMsgs < MAXMSG) {
            filename = 'tmp.json'
            data.messages = data.messages.slice(-this.newMsgs)
        } else {
            filename = `${Date.now()}.json`
            this.lastFile = filename
        }

        fs.writeFile(`./data/users/${this.begin}/${this.end}/${filename}`, JSON.stringify(data), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
}

module.exports = Tunnel