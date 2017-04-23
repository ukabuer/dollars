module.exports = Message

function Message(content, from, to, at, color) {
    this.content = content
    this.from = from
    this.to = to
    this.at = at
    this.color = color

    this.time = Date.now()
    this.system = false
}