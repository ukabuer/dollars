const Message = require('../models/message')
const Tunnel = require('../models/tunnel')
const chatroom = require('../chatroom')

function message(data, socket, io) {
    let msg = Message.from(data, socket.username, socket.color)
    if (msg.at == 'channels') {
        let user = chatroom.users.get(socket.username)
        if (!user && user.joined.indexOf(msg.to) == -1) return

        chatroom.channels.get(msg.to).addMessage(msg, socket, io)
    } else if (msg.at == 'users') {
        let begin, end
        [begin, end] = msg.from > msg.to ? [msg.from, msg.to] : [msg.to, msg.from]
        if (begin == end) return

        let tunnel = chatroom.tunnels.get(begin)
        if (undefined == tunnel) return

        if (undefined == tunnel.get(end)) {
            let messages = [], lastFile = null
            s3.getObject({ Bucket: 'moeone-dollars', Key: `data/users/${begin}/${end}/tmp.json` }, function (err, data) {
                if (err) { }
                else {
                    let tmp = JSON.parse(data.Body)
                    messages = tmp.messages
                    lastFile = tmp.lastFile
                }
                tunnel.set(end, new Tunnel(begin, end, lastFile, messages))
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
            })
        }
    }
}

module.exports = {
    name: 'message',
    type: 'normal',
    fn: message
}
