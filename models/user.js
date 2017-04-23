module.exports = User

function User(name, password, joined) {
    this.name = name
    this.password = password
    this.joined = joined || []
    this.socket = null
}
