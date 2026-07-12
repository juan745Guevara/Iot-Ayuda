const express = require('express');
const http = require('http');
const path = require('path');
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

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json({ limit: '1mb' }));

// API REST
app.use('/api/auth', authRoutes);
app.use('/api/sitios', sitiosRoutes);
app.use('/api/camara', crearRouterCamara(io));
app.use('/api/admin', adminRoutes);
app.use('/api/seguridad', seguridadRoutes);

// Frontend React (build)
app.use(express.static(frontendDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// MQTT + Socket.IO
initMqtt(io);
initSocket(io);

server.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
  console.log('Frontend React: /');
  console.log('Dev frontend: npm run dev:frontend (puerto 5173)');
});
