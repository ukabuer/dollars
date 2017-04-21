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

io.on('connection', function (socket) {
    socket.on('initial', (user) => {
        let initialData = {}
        for (channel in channels) {
            if (channel == 'default')
                initialData[channel] = channels[channel]
            else
                initialData[channel] = new Channel(channel)
        }
        channels['default'].users.push(user)
        socket.join('default')
        socket.emit('initial', initialData)
        io.in(channel).emit('join', channels[channel])
    })

    socket.on('message', (msg) => {
        let channel = msg.channel
        msg.time = Date.now()
        channels[channel].messages.push(msg)
        io.in(channel).emit('message', msg)
    })

    socket.on('join', (data) => {
        let channel = data.channel
        channels[channel].users.push(data.user)
        socket.join(channel)
        io.in(channel).emit('join', channels[channel])
    })
})

server.listen(3000)