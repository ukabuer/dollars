const fs = require('fs')
const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

const Channel = require('./models/channel')

app.use(require('koa-static')('public'))

let channels = {
    'default': {
        name: 'default',
        users: [],
        messages: [],
    },
    'tech': {
        name: 'tech',
        users: [],
        messages: [],
    }
}

let users = {}

io.on('connection', function (socket) {
    socket.on('login', (user) => {
        let initialData = {}
        for (channel in channels) {
            if (channel == 'default')
                initialData[channel] = channels[channel]
            else
                initialData[channel] = new Channel(channel)
        }
        socket.username = user
        socket.join('default')
        socket.emit('login', initialData)
        channels['default'].users.push({
            name: user,
            id: socket.id
        })     
        changeUsers(socket, 'default', 'join')
    })

    socket.on('message', (msg) => {
        let target = msg.target
        msg.time = Date.now()
        msg.user = socket.username
        if (msg.type == 'users') {
            if (msg.user > target) {
                users[msg.user][target].messages.push(msg)
            } else if (msg.user < target) {
                users[target][msg.user].messages.push(msg)
            }
            socket.emit('message', msg)
            socket.to(users[target].id).emit('message', msg)
        } else {
            channels[channel].messages.push(msg)
            io.in(target).emit('message', msg)
        }
    })

    socket.on('join', (channel) => {
        channels[channel].users.push({
            name: socket.username,
            socket: socket.id
        })
        socket.join(channel)
        socket.emit('join', channels[channel])
        changeUsers(socket, channel, 'join')
    })

    socket.on('exit', () => {
        for (channel in socket.rooms) {
            if (!channels[channel])
                continue
            let i = channels[channel].users.findIndex((user) => {
                return user.name == socket.username
            })
            channels[channel].users.splice(i, 1)
            changeUsers(socket, channel, 'exit')
        }
        socket.disconnect()
    })

    function changeUsers(socket, channel, op) {
        let user = {
            name: socket.username,
            id: socket.id    
        }
        io.in(channel).emit(op, {
            user,    
            channel
        })
        let content = `${socket.username}${op == 'join' ? '进入了本频道' : '离开了聊天室'}`
        channels[channel].messages.push({
            channel,
            system: true,
            time: Date.now(),
            content
        })

        if (op == 'join') {
            users[user.name] = user
            for (key in users) {
                _user = users[key]
                let res =  ( _user.name == user.nme ) ? 0 : ( (     _user.name > user.name ) ? 1 : -1 )
                if (res == 1)
                    users[_user.name][user.name] = {
                        name: user.name,
                        id: user.id,
                        messages: []
                    }
                else if (res == -1) {
                    users[user.name][_user.name] = {
                        name: _user.name,
                        id: _user.id,
                        messages: []
                    }
                }
            }
        }
    }
})

server.listen(3001)