module.exports = Tunnel

function Tunnel() {
    this.messages = []
}

Tunnel.prototype.addMessage = function(message, socket, target) {
    this.messages.push(message)
    socket.to(target).emit('message', message)
    socket.emit('message', message)
}