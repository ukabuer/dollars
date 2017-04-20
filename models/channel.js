module.exports = Channel

function Channel(name, users, messages, secret) {
    this.name = name
    this.users = users || []
    this.messges = messages || []
    this.secret = secret || ''
}