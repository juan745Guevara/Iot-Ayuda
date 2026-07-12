// Copia este archivo como config.h y completa tus datos.
// En Arduino IDE: Archivo → Guardar como → config.h (misma carpeta que esp8266.ino)

#pragma once

// ── WiFi (misma red que tu PC con Mosquitto y Node.js) ──
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";

// ── IP de tu PC en la red local (cmd → ipconfig → IPv4) ──
const char* MQTT_SERVER = "192.168.1.100";

// ── Sitio en PostgreSQL (tabla sitios) ──
const int SITIO_ID = 1;

// Debe coincidir con esp8266_client_id del sitio en la BD
const char* CLIENT_ID = "esp8266-sitio-1";
