const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const { initMqtt } = require('./mqtt/client');
const { initSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const sitiosRoutes = require('./routes/sitios');
const crearRouterCamara = require('./routes/camara');
const adminRoutes = require('./routes/admin');
const seguridadRoutes = require('./routes/seguridad');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// API REST
app.use('/api/auth', authRoutes);
app.use('/api/sitios', sitiosRoutes);
app.use('/api/camara', crearRouterCamara(io));
app.use('/api/admin', adminRoutes);

app.use('/api/seguridad', seguridadRoutes);

// MQTT + Socket.IO
initMqtt(io);
initSocket(io);

server.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
  console.log('Panel público: /');
  console.log('Login seguridad: /login.html');
  console.log('Dashboard seguridad: /seguridad/dashboard.html');
  console.log('Panel admin: /admin/index.html');
});
