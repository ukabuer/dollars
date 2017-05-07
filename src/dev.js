const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const config = require('../webpack.config')
const compiler = webpack(config)

function koaDevMiddleware(expressDevMiddleware) {
    return function middleware(ctx, next) {
        return new Promise((resolve, reject) => {
            expressDevMiddleware(ctx.req, {
                end: (content) => {
                    ctx.body = content
                    resolve()
                },
                setHeader: (name, value) => {
                    ctx.set(name, value)
                },
            }, reject)
        }).catch(next)
    }
}

function koaHotMiddleware(expressHotMiddleware) {
    return function middleware(ctx, next) {
        return new Promise((resolve) => {
            expressHotMiddleware(ctx.req, ctx.res, resolve)
        }).then(next)
    }
}

const expressDevMiddleware = webpackDevMiddleware(compiler, {
    /* opt */
    publicPath: config.output.publicPath,
    stats: {
        colors: true
    }
})
const expressHotMiddleware = webpackHotMiddleware(compiler, {/*opt*/})

module.exports = {
    devMiddleware: koaDevMiddleware(expressDevMiddleware),
    hotMiddleware: koaHotMiddleware(expressHotMiddleware),
}