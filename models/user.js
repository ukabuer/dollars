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

    static writeToFile(users) {
        let data = []
        users.forEach((user) => {
            data.push({
                name: user.name,
                password: user.password,
                joined: user.joined,
                lastLogoutTime: user.lastLogoutTime,
            })
        });

        fs.writeFile(`./data/users.json`, JSON.stringify(data), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }

    static from(user) {
        let tmp = new User()
        return Object.assign(tmp, user)
    }
}

module.exports = User