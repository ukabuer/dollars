const fs = require('fs')
const Message = require('./message')

const MAXMSG = 100

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
        if (this.newMsgs >= MAXMSG) {
            this.writeToFile()
            this.newMsgs = 0
        }

        if (this.messages.length >= MAXMSG) {
            this.messages.shift()
        }
    }

    getUserList(socket) {
        socket.emit('channelUsers', this.usernames)
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

        fs.writeFile(`./data/channels/${this.name}/${filename}`, JSON.stringify(data), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }

    static from(channel, lastFile = null, messages = []) {
        let tmp = new Channel()
        channel.lastFile = lastFile
        channel.messages = messages
        return Object.assign(tmp, channel)
    }
}

module.exports = Channel