module.exports = Channel

function Channel(name, secret, users, messages) {
    this.name = name
    this.users = users || []
    this.messages = messages || []
    this.secret = secret || ''
}