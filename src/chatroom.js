const fs = require('fs')
const jwt = require('jsonwebtoken')
const aws = require('aws-sdk')
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
    s3AccessKeyId: config.s3AccessKeyId,
    s3SecretAccessKey: config.s3SecretAccessKey,

    login,
    saveUsers,
    backup
}

if (process.env.s3AccessKeyId) {
    chatroom.s3AccessKeyId = process.env.s3AccessKeyId
    chatroom.s3SecretAccessKey = process.env.s3SecretAccessKey
}

const s3 = new aws.S3({
    accessKeyId: chatroom.s3AccessKeyId,
    secretAccessKey: chatroom.s3SecretAccessKey,
})

let users = [], channels = [new Channel(chatroom.default)]

const colors = ['cornflowerblue', 'tan', 'brown', 'firebrick', 'sienna', 'deepskyblue', 'cadetblue', 'blueviolet', 'hotpink', 'darkcyan', 'darkorange']

try {
    var params = { Bucket: 'moeone-dollars', Key: 'data/users.json' }
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            users = JSON.parse(data.Body)
        }
        users.forEach((user) => {
            let newUser = User.from(user)
            if (config.admins.indexOf(newUser.name) != -1) newUser.isAdmin = true
            chatroom.users.set(user.name, newUser)
            chatroom.tunnels.set(user.name, new Map())
        })
    })

    params = { Bucket: 'moeone-dollars', Key: 'data/channels.json' }
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err)            
        } else {
            channels = JSON.parse(data.Body)
        }
        channels.forEach((channel) => {
            let messages = [], lastFile = null
            s3.getObject({ Bucket: 'moeone-dollars', Key: `data/channels/${channel.name}/tmp.json` }, function (err, data) {
                if (err) {}
                else {
                    let tmp = JSON.parse(data.Body)
                    messages = tmp.messages
                    lastFile = tmp.lastFile
                }
                chatroom.channels.set(channel.name, Channel.from(channel, lastFile, messages))
            })
        })
    })
} catch (e) { console.log(e) }

if (!chatroom.public) chatroom.allowUsers = chatroom.admins

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
        delete user.offlineMsgs
        usersData.push(user)
    })
    chatroom.tunnels.forEach((middle) => {
        middle.forEach((tunnel) => {
            tunnel.writeToFile()
        })
    })

    s3.upload({
        Bucket: 'moeone-dollars',
        Key: 'data/channels.json',
        Body: JSON.stringify(channelsData)
    }, function (err, data) {
        if (err) console.log(err)
    })

    s3.upload({
        Bucket: 'moeone-dollars',
        Key: 'data/users.json',
        Body: JSON.stringify(usersData)
    }, function (err, data) {
        if (err) console.log(err)
    })
}

function saveUsers() {
    let data = []
    chatroom.users.forEach((user) => {
        user = User.from(user)
        delete user.socket
        data.push(user)
    })
    s3.upload({
        Bucket: 'moeone-dollars',
        Key: 'data/users.json',
        Body: JSON.stringify(data)
    }, function (err, data) {
        if (err) console.log(err)
    })
}

function login(user, socket) {
    if (user.isAdmin) socket.isAdmin = true
    user.socket = socket.id
    socket.color = colors[Math.floor(Math.random() * colors.length)]
    socket.username = user.name

    /* send user the chatroom info */
    let token = jwt.sign({ name: user.name }, chatroom.secret)
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