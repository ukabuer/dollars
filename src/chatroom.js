const fs = require('fs')
const User = require('./models/user')
const Channel = require('./models/channel')
const config = require('../config.json')

let chatroom = {
    port: config.port,
    public: config.public,
    defaultChannel: config.defaultChannel,
    admins: config.admins,
    users: new Map(),
    channels: new Map(),
    tunnels: new Map(),

    load,
    saveUsers,
    backup
}

function load() {
    let users = [], channels = [new Channel(chatroom.defaultChannel)]

    try {
        users = require('../data/users.json')
        channels = require('../data/channels.json')
    } catch (e) { }

    if (!chatroom.public) chatroom.allowUsers = chatroom.admins
    if (!fs.existsSync('./data')) fs.mkdirSync('./data')
    if (!fs.existsSync(`./data/users`)) fs.mkdirSync(`./data/users`)
    if (!fs.existsSync(`./data/channels`)) fs.mkdirSync(`./data/channels`)

    users.forEach((user) => {
        let newUser = User.from(user)
        if (config.admins.indexOf(newUser.name) != -1) newUser.admin = true
        chatroom.users.set(user.name, newUser)
        chatroom.tunnels.set(user.name, new Map())
    })

    channels.forEach((channel) => {
        let messages = [], lastFile = null
        if (!fs.existsSync(`./data/channels/${channel.name}`)) {
            fs.mkdirSync(`./data/channels/${channel.name}`)
        }
        if (fs.existsSync(`./data/channels/${channel.name}/tmp.json`)) {
            try {
                let tmp = require(`../data/channels/${channel.name}/tmp.json`)
                messages = tmp.messages
                lastFile = tmp.lastFile
            } catch (e) { }
        }
        chatroom.channels.set(channel.name, Channel.from(channel, lastFile, messages))
    })
}

function backup() {
    let channelsData = [], usersData = []
    chatroom.channels.forEach((channel) => {
        channel.writeToFile()
        channelsData.push({
            name: channel.name,
            public: channel.public,
            owners: channel.owners,
            usernames: channel.usernames
        })
    })
    chatroom.users.forEach((user) => {
        user = User.from(user)
        delete user.socket
        usersData.push(user)
    })
    chatroom.tunnels.forEach((middle) => {
        middle.forEach((tunnel) => {
            tunnel.writeToFile()
        })
    })

    fs.writeFile('./data/channels.json', JSON.stringify(channelsData), () => { })
    fs.writeFile('./data/users.json', JSON.stringify(usersData), () => { })
}

function saveUsers() {
    let data = []
    chatroom.users.forEach((user) => {
        data.push({
            name: user.name,
            password: user.password,
            joined: user.joined,
            lastLogoutTime: user.lastLogoutTime,
        })
    })

    fs.writeFile(`./data/users.json`, JSON.stringify(data), (err) => {
        if (err) console.log(err)
    })
}

module.exports = chatroom