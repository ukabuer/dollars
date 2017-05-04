const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

const chatroom = require('./chatroom')
const events = require('./events/events')

app.use(require('koa-static')('public'))

chatroom.load()

io.on('connection', function (socket) {
    ['signup', 'login'].forEach((event) => {
        socket.on(event, (data) => {
            if (events[event](data, socket, io)) init(socket)
        })
    })
})

function init(socket) {
    events.normal.forEach((event) => {
        socket.on(event, (data) => {
            events[event](data, socket, io)
        })
    })

    if (socket.admin) {
        events.admin.forEach((event) => {
            socket.on(event, (data) => {
                events[event](data, socket, io)
            })
        })
    }
}

server.listen(chatroom.port)