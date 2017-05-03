const fs = require('fs')
const Message = require('./message')

class Channel {
    constructor(name, owners, _public, usernames, lastFile, messages) {
        this.name = name
        this.owners = owners || []
        this.public = _public || true
        this.usernames = usernames || []
        this.lastFile = lastFile || ''

        this.messages = messages || []
        this.newMsgs = messages ? messages.length : 0
    }

    addUser(username, socket, sockets) {
        socket.join(this.name)
        this.usernames.push(username)

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

    removeUser(username, socket, sockets) {
        socket.leave(this.name)
        let index = this.usernames.indexOf(username)
        this.usernames.splice(index, 1)

        /* notificate other users in channel */
        let msg = new Message(`${username}离开了频道`, 'system', this.name, 'channels')
        msg.system = true
        this.addMessage(msg, socket, sockets)
    }

    addMessage(message, socket, sockets) {
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

    getUserList(socket) {
        socket.emit('channelUsers', this.usernames)
    }

    writeToFile(sync = false) {
        let filename = `${Date.now()}.json`
        var data = {
            lastFile: this.lastFile,
            messages: this.messages
        }
        if (sync) {
            data.messages = data.messages.slice(-this.newMsgs)
            fs.writeFileSync(`./data/channels/${this.name}/${filename}`, JSON.stringify(data))
        } else {
            fs.writeFile(`./data/channels/${this.name}/${filename}`, JSON.stringify(data), (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }
        this.lastFile = filename
    }

    static from(channel, lastFile = null, messages = []) {
        let tmp = new Channel()
        tmp.lastFile = lastFile
        tmp.messages = messages
        return Object.assign(tmp, channel)
    }
}

module.exports = Channel