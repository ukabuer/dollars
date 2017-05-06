const fs = require('fs')
const chatroom = require('../chatroom')

const publicPath = './data/public/'

function avatar(file, username, socket, io) {
    let user = chatroom.users.get(username)
    if (!user) return false
    
    let index = file.name.indexOf('.')
    filename = username + Date.now() + file.name.substring(index)
    fs.renameSync(file.path, publicPath + 'avatars/' + filename)
    user.avatar = './avatars/'+filename
    io.in(chatroom.default).emit('update', {username, avatar: './avatars/'+filename})
    return true
}

function image(file, username) {
    let index = file.name.indexOf('.')
    fs.renameSync(file.path, publicPath+'images/'+Date.now() + file.name.substring(index))
    return true
}

module.exports = {
    avatar,
    image
}