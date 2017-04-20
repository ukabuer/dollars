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
    }
}

io.on('connection', function (socket) {

    socket.on('connect', (user) => {
        let initialData = {}
        for (channel in channels) {
            if (channel == 'defualt')
                initialData[channel] = channels.channel
            esle
                initialData[channel] = new Channel(channel)
        }
        channels['default'].users.push(user)
        socket.emit('connect', initialData)
    })

    socket.on('message', (msg) => {
        let channel = msg.channel
        msg.time = Date.now()
        this.channels[channel].messages.push(msg)
        io.emit('message', msg)
    })

    socket.on('join', (data) => {
        let channel = data.channel
        channels[channel].users.push(data.user)
        io.emit('join', this.channels[channel])
    })
})

server.listen(3000)