// Punto de entrada del servidor: Express + Socket.IO + MQTT + frontend estático

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
const server = http.createServer(app); // HTTP necesario para Socket.IO
const io = new Server(server);

// Carpeta del build de React (npm run build)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

// Parsear JSON en peticiones REST (límite 1 MB)
app.use(express.json({ limit: '1mb' }));

// Montar rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/sitios', sitiosRoutes);
app.use('/api/camara', crearRouterCamara(io)); // Recibe frames del ESP32-CAM
app.use('/api/admin', adminRoutes);
app.use('/api/seguridad', seguridadRoutes);

// Servir archivos estáticos del frontend compilado
app.use(express.static(frontendDist));

// SPA: cualquier ruta que no sea /api devuelve index.html (React Router)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Conectar broker MQTT y eventos en tiempo real
initMqtt(io);
initSocket(io);

server.listen(config.port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${config.port}`);
  console.log('Frontend React: /');
  console.log('Dev frontend: npm run dev:frontend (puerto 5173)');
});
