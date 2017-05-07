const fs = require('fs')
const jwt = require('jsonwebtoken')
const User = require('./models/user')
const Channel = require('./models/channel')
const config = require('../config.json')

let chatroom = {
    port: config.port,
    public: config.public,
    secret: config.secret,
    default: config.default,
    admins: config.admins,
    users: new Map(),
    channels: new Map(),
    tunnels: new Map(),

    login,
    saveUsers,
    backup
}

let users = [], channels = [new Channel(chatroom.default)]

const colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']

try {
    users = require('../data/users.json')
    channels = require('../data/channels.json')
} catch (e) { }

if (!chatroom.public) chatroom.allowUsers = chatroom.admins
if (!fs.existsSync('./data')) fs.mkdirSync('./data')
if (!fs.existsSync(`./data/users`)) fs.mkdirSync(`./data/users`)
if (!fs.existsSync(`./data/channels`)) fs.mkdirSync(`./data/channels`)
if (!fs.existsSync(`./data/public`)) fs.mkdirSync(`./data/public`)
if (!fs.existsSync(`./data/public/avatars`)) fs.mkdirSync(`./data/public/avatars`)
if (!fs.existsSync(`./data/public/images`)) fs.mkdirSync(`./data/public/images`)

users.forEach((user) => {
    let newUser = User.from(user)
    if (config.admins.indexOf(newUser.name) != -1) newUser.isAdmin = true
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
        user = User.from(user)
        delete user.socket
        data.push(user)
    })

    fs.writeFile(`./data/users.json`, JSON.stringify(data), (err) => {
        if (err) console.log(err)
    })
}

function login(user, socket) {
    if (user.isAdmin) socket.isAdmin = true
    user.socket = socket.id
    socket.color = colors[Math.floor(Math.random() * colors.length)]
    socket.username = user.name

    /* send user the chatroom info */
    let token = jwt.sign({name: user.name}, chatroom.secret)
    let data = {
        user: {
            name: user.name,
            isAdmin: user.isAdmin,
            avatar: user.avatar
        },
        token: token,
        channelList: [],
        joined: {},
        users: {},
        offlineMsgs: user.offlineMsgs,
        lastLogoutTime: user.lastLogoutTime
    }
    chatroom.channels.forEach((channel, name) => {
        data.channelList.push(name)
    })
    user.joined.forEach((channel) => {
        socket.join(channel)
        data.joined[channel] = {
            name: channel,
            messages: chatroom.channels.get(channel).messages,
            joined: true,
        }
    })

    let username = socket.username
    chatroom.users.forEach((user) => {
        let begin, end
        [begin, end] = username > user.name ? [username, user.name] : [user.name, username]
        let tmp = chatroom.tunnels.get(begin).get(end)
        data.users[user.name] = {
            name: user.name,
            online: user.socket != null,
            messages: tmp == undefined ? [] : tmp.messages,
            avatar: user.avatar
        }
    })
    socket.emit('login succeed', data)
    socket.to(chatroom.default).emit('updateUser', {
        name: user.name, 
        isAdmin: user.isAdmin,
        online: user.socket != null,
        avatar: user.avatar
    })
}

module.exports = chatroom