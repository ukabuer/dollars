const fs = require('fs')
const Koa = require('koa') //maybe it's not needed
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

/* TODO using consitent data */
/* tmp data */
let users = new Map()
config.users.forEach((user) => {
    users.set(user.name, new User(user.name, user.password, user.joined))
})

let channels = new Map()
config.channels.forEach((channel) => {
    channels.set(channel.name, new Channel(channel.name, channel.owner, channel.system))
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
        if (auth.username.length < 4 || auth.password.length < 6) {
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
            socket.emit('login failed', '该用户已登陆')
            return
        }
        connect(user, socket)
    })

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
        socket.disconnect()

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

    function connect(user, socket) {
        user.socket = socket.id
        socket.color = colors[Math.floor(Math.random()*colors.length)]
        socket.username = user.name

        /* send user the chatroom info */
        let chatroom = {
            channelList: [],
            joined: {},
            users: {},
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
    }
})

server.listen(3000)