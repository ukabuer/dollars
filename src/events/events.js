const events = {
    normal: ['message', 'join', 'leave', 'logout', 'getUsers'],
    admin: ['addChannel', 'allowGuest', 'forbidGuest', 'allowUser', 'backup'],
    signup: require('./signup'),
    login: require('./login')
}

events.normal.forEach((event) => {
    events[event] = require(`./${event}`)
})

events.admin.forEach((event) => {
    events[event] = require(`./${event}`)
})

module.exports = events