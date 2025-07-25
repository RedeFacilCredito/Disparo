// backend/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Em produção, restrinja para a URL do seu frontend
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('[Socket.IO] Novo cliente conectado:', socket.id);
        socket.on('disconnect', () => {
            console.log('[Socket.IO] Cliente desconectado:', socket.id);
        });
    });

    console.log('✔ Servidor Socket.IO inicializado.');
    return io;
}

function getIO() {
    if (!io) {
        throw new Error("Socket.IO não foi inicializado!");
    }
    return io;
}

module.exports = { initSocket, getIO };