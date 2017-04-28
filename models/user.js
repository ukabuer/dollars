const fs = require('fs')

module.exports = User

function User(name, password, joined, lastLogoutTime) {
    this.name = name
    this.password = password
    this.joined = joined || []
    this.lastLogoutTime = lastLogoutTime || null
    this.socket = null
    this.offlineMsgs = new Map()
}

User.prototype.writeToFile = (users) => {
    let data = []
    users.forEach((user) => {
        data.push({
            name: user.name,
            password: user.password,
            joined: user.joined
        })
    });

    fs.writeFile(`./data/users.json`, JSON.stringify(data), (err) => {
        if (err) {
            console.log(err)
        }
    })

}