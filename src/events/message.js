const Message = require('../models/message')
const Tunnel = require('../models/tunnel')
const chatroom = require('../chatroom')

function message(data, socket, io) {
    let msg = Message.from(data, socket.username, socket.color)
    if (msg.at == 'channels') {
        if (chatroom.users.get(socket.username).joined.indexOf(msg.to) == -1) {
            return
        }
        chatroom.channels.get(msg.to).addMessage(msg, socket, io)
    } else if (msg.at == 'users') {
        let begin, end
        [begin, end] = msg.from > msg.to ? [msg.from, msg.to] : [msg.to, msg.from]
        if (begin == end) {
            return
        }

        let tunnel = chatroom.tunnels.get(begin)
        if (undefined == tunnel) {
            return
        }

        if (undefined == tunnel.get(end)) {
            let messages = [], lastFile = null
            try {
                if (!fs.existsSync(`./data/users/${begin}/${end}`)) {
                    fs.mkdirSync(`./data/users/${begin}/${end}`)
                }
                let msgFile = require(`../data/users/${begin}/${end}/tmp.json`)
                messages = msgFile.messages
                lastFile = msgFile.lastFile
            } catch (e) { }

            tunnel.set(end, new Tunnel(begin, end, lastFile, messages))
        }

        let target = chatroom.users.get(msg.to)
        tunnel.get(end).addMessage(msg, socket, target.socket)

        if (null == target.socket) {
            let offMsgs = target.offlineMsgs[msg.from]
            if (undefined == offMsgs) {
                target.offlineMsgs[msg.from] = 1
            } else {
                target.offlineMsgs[msg.from] = offMsgs + 1
            }
        }
    }
}

module.exports = message
