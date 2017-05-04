class Message {
    constructor(content, from, to, at, color, type) {
        this.content = content
        this.from = from
        this.to = to
        this.at = at
        this.color = color
        this.type = type || 0 // 0: text,  1: image, 2: voice??

        this.time = Date.now()
        this.system = false
    }

    static from(message, username, color) {
        let tmp = new Message()
        tmp.from = username
        tmp.color = color
        return Object.assign(tmp, message)
    }
}

module.exports = Message