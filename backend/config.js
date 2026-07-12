const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cambiar-este-secreto-en-produccion',
  mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/iot_ayuda',
};
