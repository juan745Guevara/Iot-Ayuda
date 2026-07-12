// Cliente MQTT: recibe aforo del ESP8266 y emite por Socket.IO

const mqtt = require('mqtt');
const config = require('../config');
const { registrarCambioAforo } = require('../services/aforo-stats');

let mqttClient = null;

function initMqtt(io) {
  mqttClient = mqtt.connect(config.mqttBroker);

  mqttClient.on('connect', () => {
    console.log('Conectado al Broker MQTT');
    // Suscribirse a todos los sitios: aforo/{id}/aforo y aforo/{id}/setear
    mqttClient.subscribe('aforo/+/aforo');
    mqttClient.subscribe('aforo/+/setear');
  });

  mqttClient.on('message', async (topic, message) => {
    // Topic esperado: aforo/{sitio_id}/{accion}
    const partes = topic.split('/');
    if (partes.length !== 3 || partes[0] !== 'aforo') return;

    const sitioId = parseInt(partes[1], 10);
    const accion = partes[2];
    const valor = parseInt(message.toString(), 10);

    if (isNaN(sitioId) || isNaN(valor)) return;

    if (accion === 'aforo' || accion === 'setear') {
      try {
        const resultado = await registrarCambioAforo(sitioId, valor);

        // Notificar navegadores en el room del sitio
        if (resultado) {
          io.to(`sitio_${sitioId}`).emit('aforo', {
            sitio_id: sitioId,
            aforo_actual: valor,
          });
        }
      } catch (err) {
        console.error('Error al registrar aforo:', err.message);
      }
    }
  });

  mqttClient.on('error', (err) => {
    console.error('Error MQTT:', err.message);
  });

  return mqttClient;
}

function getMqttClient() {
  return mqttClient;
}

// Publicar alarma al buzzer del ESP8266 (topic aforo/{id}/alarma)
function publicarAlarma(sitioId, mensaje = '1') {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(`aforo/${sitioId}/alarma`, mensaje);
  }
}

// Forzar aforo desde backend (topic aforo/{id}/setear)
function publicarSetear(sitioId, valor) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(`aforo/${sitioId}/setear`, String(valor));
  }
}

module.exports = { initMqtt, getMqttClient, publicarAlarma, publicarSetear };
