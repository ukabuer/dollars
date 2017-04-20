module.exports = Message

function Message(user, content, channel, time) {
    this.user = user
    this.channel = channel
    this.content = content
    this.time = time
}