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

    channels.set(channel.name, new Channel(channel.name, channel.owners, channel.public, channel.usernames, channel.newestFile, lastFile, messages))
})

let tunnels = new Map()
users.forEach((user) => {
    tunnels.set(user.name, new Map())
})

let colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']


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
        tunnels.set(user.name, new Map())

        connect(user, socket)
        channels.get('default').addUser(user.name, socket, io)
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
        let offlineMsgs = {}
        try {
            offlineMsgs = require(`./data/users/${user.name}/offline.json`)
        } catch (e) { }

        let chatroom = {
            channelList: [],
            joined: {},
            users: {},
            offlineMsgs,
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
                let high, low
                [high, low] = msg.from > msg.to ? [msg.from, msg.to] : [msg.to, msg.from]
                if (high == low) return
                let tmp = tunnels.get(high)
                if (undefined == tmp.get(low))
                    tmp.set(low, new Tunnel())
                let socketId = users.get(msg.to).socket
                tmp.get(low).addMessage(msg, socket, socketId)
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
            fs.writeFile(`avatar_${socket.username}`, data, () => {

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
        channelsData.push({
            name: channel.name,
            owners: channel.owners,
            usernames: channel.usernames,
            public: channel.public,
            newestFile: channel.newestFile
        })
    })
    users.forEach((user) => {
        usersData.push({
            name: user.name,
            password: user.password,
            joined: user.joined,
            lastLogoutTime: Date.now()
        })
    })
    fs.writeFileSync('./data/channels.json', JSON.stringify(channelsData))

    fs.writeFileSync('./data/users.json', JSON.stringify(usersData))

    process.exit();
});