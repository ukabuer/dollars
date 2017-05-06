const fs = require('fs')

let events = {}

let files = fs.readdirSync('./src/events').filter((filename) => {
    return filename.substr(-3, 3) == '.js' && filename != 'events.js'
})

files.forEach((name) => {
    let event = require(`./${name}`)
    if (!events[event.type]) events[event.type] = []
    events[event.type].push(event.name)
    events[event.name] = event.fn
})

module.exports = events