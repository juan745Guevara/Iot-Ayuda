const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//================== MQTT ==================

// Dirección del broker MQTT
const MQTT_BROKER = "mqtt://localhost:1883"; // Cambia la IP

const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
    console.log("✅ Conectado al Broker MQTT");
    client.subscribe("aforo");
});

client.on("message", (topic, message) => {
   
    if (topic == "aforo") {
        const data = message.toString();
        io.emit("aforo", { message: data});
    }
});

client.on("error", (err) => {
    console.log("Error MQTT:", err.message);
});

//==========================================

// Servir archivos
app.use(express.static('public'));

// Socket.IO
io.on('connection', (socket) => {

    console.log(`Usuario conectado: ${socket.id}`);

    // Si el navegador quiere publicar en MQTT
    socket.on("alarma", (data) => {
        client.publish("alarma", data.message);

    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

});

// Puerto
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});