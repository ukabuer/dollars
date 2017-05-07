const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

const chatroom = require('./chatroom')

const serve = require('koa-static')
const koaBody = require('koa-body')
const koajwt = require('koa-jwt')
const upload = require('./routes/upload')

if (process.env.NODE_ENV == 'development') {
    app.use(require('./dev').devMiddleware)
    app.use(require('./dev').hotMiddleware)
}

app.use(serve('data/public'))
app.use(serve('public'))
app.use(koaBody({ multipart: true }))
app.use(function (ctx, next) {
    return next().catch((err) => {
        if (401 == err.status) {
            ctx.status = 401
            ctx.body = 'Protected resource, use Authorization header to get access\n'
        } else {
            throw err
        }
    })
})
app.use(koajwt({ secret: 'dollars', exp: 24 * 60 * 60}))
app.use((ctx, next) => {
    if (ctx.method == 'POST' && /^\/avatar/.test(ctx.url)) {
        let user = chatroom.users.get(ctx.state.user.name)
        if (!user) {
            ctx.status = 403
            return
        }
        if (!ctx.request.body.files) return

        if (upload.avatar(ctx.request.body.files.avatar, ctx.state.user.name, user.socket, io)) {
            ctx.status = 200
        }
    } else {
        return next()
    }
})
app.use((ctx, next) => {
    if (ctx.method == 'POST' && /^\/images/.test(ctx.url)) {
        let user = chatroom.users.get(ctx.state.user.name)
        if (!user) {
            ctx.status = 403
            return
        }
        if (!ctx.request.body.files) return
        
        if (upload.avatar(ctx.request.body.files.image, ctx.state.user.username)) {
            ctx.status = 200
        }
    } else {
        return next()
    }
})

const events = require('./events/events')

io.on('connection', (socket) => {
    ['login', 'token', 'signup'].forEach((event) => {
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

    if (!socket.isAdmin) return

    events.admin.forEach((event) => {
        socket.on(event, (data) => {
            events[event](data, socket, io)
        })
    })
}

server.listen(chatroom.port)