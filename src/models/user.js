const fs = require('fs')

class User {
    constructor(name, password, joined = [], lastLogoutTime = null) {
        this.name = name
        this.password = password
        this.joined = joined
        this.lastLogoutTime = lastLogoutTime

        this.socket = null
        this.offlineMsgs = {}
        this.admin = false
    }

    static from(user) {
        let tmp = new User()
        return Object.assign(tmp, user)
    }
}

module.exports = User