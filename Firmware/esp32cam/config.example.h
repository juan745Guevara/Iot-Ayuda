// Copia este archivo como config.h y completa tus datos.

#pragma once

const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";

// IP de tu PC + puerto del backend (misma IP que MQTT_SERVER del ESP8266)
const char* SERVER_URL = "http://192.168.1.100:3000";

const int SITIO_ID = 1;
const char* CLIENT_ID = "esp32cam-sitio-1";

// Milisegundos entre frames (250 ≈ 4 fps)
const unsigned long INTERVALO_MS = 250;
