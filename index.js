const fs = require('fs')
const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)
const config = require('./config.json')
app.use(require('koa-static')('public'))

/* import class */
const Channel = require('./models/channel')
const Message = require('./models/message')
const User = require('./models/user')
const Tunnel = require('./models/tunnel')

/* load data */
let chatroom = {
    users: [],
    channels: [new Channel('default')]
}

try {
    chatroom.users = require('./data/users.json')
    chatroom.channels = require('./data/channels.json')
} catch (e) {
    console.log(e)
}

let users = new Map()
chatroom.users.forEach((user) => {
    users.set(user.name, new User(user.name, user.password, user.joined, user.lastLogoutTime))
})

let channels = new Map()
chatroom.channels.forEach((channel) => {
    let messages = [], newMsgs, lastFile
    if (channel.newestFile) {
        try {
            let msgFile = require(`./data/channels/${channel.name}/${channel.newestFile}`)
            fs.unlink(`./data/channels/${channel.name}/${channel.newestFile}`, (err) => {
                if (err) {
                    console.log(err)
                }
            })
            messages = msgFile.messages
            lastFile = msgFile.lastFile
        } catch (e) {
            console.log(e)
        }
    }

    channels.set(channel.name, new Channel(channel.name, channel.owners, channel.public, channel.usernames, lastFile, messages))
})

let tunnels = new Map()
users.forEach((user) => {
    tunnels.set(user.name, new Map())
})

let colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']
/* end */


io.on('connection', function (socket) {

    socket.on('signup', (auth) => {
        if (!auth.username || !auth.password) {
            socket.emit('signup failed', '需要用户信息')
            return
        }
        if (auth.username.length < 2 || auth.password.length < 6) {
            socket.emit('signup failed', '用户名或者密码太短')
            return
        }
        if (users.has(auth.username)) {
            socket.emit('signup failed', '用户名已经存在')
            return
        }

        let user = new User(auth.username, auth.password)
        user.joined.push('default')
        users.set(user.name, user)
        user.writeToFile(users)

        tunnels.set(user.name, new Map())

        connect(user, socket)
        channels.get('default').addUser(user.name, socket, io)
        console.log(3)
    })

    socket.on('login', (auth) => {
        if (!auth.username || !auth.password) {
            socket.emit('login failed', `需要用户信息`)
            return
        }

        let user = null
        if (!config.public) {
            user = users.get(auth.username)
            if (undefined === user) {
                socket.emit('login failed', `${auth.username}？不存在的`)
                return
            } else if (auth.password != user.password) {
                socket.emit('login failed', '密码错误')
                return
            }
        } else {
            user = new User(auth.username, auth.password)
        }
        if (user.socket != null) {
            socket.to(user.socket).emit('exit', '本账号在另一处登录了')
        }
        connect(user, socket)
    })

    function connect(user, socket) {
        user.socket = socket.id
        socket.color = colors[Math.floor(Math.random() * colors.length)]
        socket.username = user.name

        /* send user the chatroom info */
        let chatroom = {
            channelList: [],
            joined: {},
            users: {},
            offlineMsgs: user.offlineMsgs,
            lastLogoutTime: user.lastLogoutTime
        }
        channels.forEach((channel, name) => {
            chatroom.channelList.push(name)
        })
        user.joined.forEach((channel) => {
            socket.join(channel)
            chatroom.joined[channel] = {
                name: channel,
                messages: channels.get(channel).messages,
                joined: true
            }
        })

        let username = socket.username
        users.forEach((user) => {
            let high, low
            [high, low] = username > user.name ? [username, user.name] : [user.name, username]
            let tmp = tunnels.get(high).get(low)
            chatroom.users[user.name] = {
                name: user.name,
                online: user.socket != null,
                messages: tmp == undefined ? [] : tmp.messages,
            }
        })
        socket.emit('login succeed', chatroom)
        socket.to('default').emit('login', user.name)

        socket.on('message', (data) => {
            let msg = new Message(data.content, socket.username, data.to, data.at, socket.color)
            if (msg.at == 'channels') {
                /* TODO make sure user is in the channel */
                channels.get(msg.to).addMessage(msg, socket, io)
            } else if (msg.at == 'users') {
                let begin, end
                [begin, end] = msg.from > msg.to ? [msg.from, msg.to] : [msg.to, msg.from]
                if (begin == end) {
                    return
                }

                let tunnel = tunnels.get(begin)
                if (undefined == tunnel) {
                    return 
                }

                if (undefined == tunnel.get(end)) {
                    let messages = [], lastFile = null
                    try {
                        let newestFilename = require(`./data/users/${high}/${low}/tunnel.json`)
                        let msgFile = require(`./data/users/${high}/${low}/${newestFilename}`)
                        messages = msgFile.messages
                        lastFile = msgFile.lastFile
                    } catch (e) { }
                    tunnel.set(end, new Tunnel(begin, end, lastFile, newestFile))
                }
                tunnel.get(end).addMessage(msg, socket, target.socket)

                let target = users.get(msg.to)
                if (null == target.socket) {
                    let offMsgs = target.offlineMsgs.get(target.from)
                    if (undefined == offMsgs) {
                        target.offlineMsgs.set(target.from, 0)
                    } else {
                        target.offlineMsgs.set(target.from, offMsgs + 1)
                    }
                }                
            }
        })

        socket.on('join', (channel) => {
            let user = users.get(socket.username)
            user.joined.push(channel)
            channels.get(channel).addUser(user.name, socket, io)
        })

        socket.on('leave', (channel) => {
            if (channel == 'default') {
                return
            }
            let user = users.get(socket.username)
            let index = user.joined.indexOf(channel)
            user.joined.splice(index, 1)
            channels.get(channel).removeUser(user.name, socket, io)
        })

        socket.on('logout', () => {
            if (!socket.username) {
                return
            }
            let user = users.get(socket.username)
            socket.disconnect(true)

            user.socket = null
            user.lastLogoutTime = Date.now()
            if (config.public) {
                user.channels.forEach(channel => {
                    channels.get(channel).removeUser(user.name, socket, io)
                })
            }
            io.to('default').emit('logout', user.name)
        })

        socket.on('channelUsers', channel => {
            channels.get(channel).getUserList(socket)
        })

        socket.on('upload avatar', (data) => {
            fs.writeFile(`./data/images/avatar/${socket.username}`, data, () => {

            })
        })
    }
})

server.listen(config.port)

process.on('SIGINT', () => {
    process.exit()
})

process.on('exit', function() {
    let channelsData = [], usersData = []
    channels.forEach((channel) => {
        channel.writeToFile(true)
        channel.newestFile = channel.lastFile
        delete channel.messages
        delete channel.lastFile
        delete channel.newMsgs
        channelsData.push(channel)
    })
    users.forEach((user) => {
        delete user.socket
        usersData.push(user)
    })
    tunnels.forEach((middle) => {
        middle.forEach((tunnel) => {
            tunnel.writeTOFile(true)
        })
    })

    fs.writeFileSync('./data/channels.json', JSON.stringify(channelsData))
    fs.writeFileSync('./data/users.json', JSON.stringify(usersData))

    process.exit();
});