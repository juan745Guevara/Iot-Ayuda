// Carga variables de entorno desde .env en la raíz del proyecto

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000, // Puerto del servidor web
  jwtSecret: process.env.JWT_SECRET || 'cambiar-este-secreto-en-produccion', // Firma de tokens JWT
  mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883', // Broker Mosquitto
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/iot_ayuda',
};
