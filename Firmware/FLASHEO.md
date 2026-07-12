# Flasheo — ESP8266 y ESP32-CAM

Solo hay **dos archivos** en esta carpeta:

```
Firmware/
├── esp8266.ino    ← aforo + MQTT
├── esp32cam.ino   ← cámara en vivo
└── FLASHEO.md
```

Antes de subir cada sketch, edita la sección **CONFIGURACIÓN** al inicio del archivo `.ino` correspondiente.

---

## Antes de flashear

1. El servidor debe estar corriendo (`npm start` en la raíz del proyecto).
2. Mosquitto activo (puerto 1883).
3. PC y ESP en la **misma red WiFi**.
4. Obtén la IP de tu PC:
   ```powershell
   ipconfig
   ```
   Usa la **IPv4** del WiFi (ej. `192.168.1.100`). Los ESP no pueden usar `localhost`.

---

## esp8266.ino — qué cambiar

Abre `Firmware/esp8266.ino` y edita estas líneas al inicio:

```cpp
const char* WIFI_SSID     = "TU_RED_WIFI";        // ← nombre de tu WiFi
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";      // ← clave del WiFi
const char* MQTT_SERVER   = "192.168.1.100";      // ← IP de tu PC
const int SITIO_ID        = 1;                    // ← id del sitio en PostgreSQL
const char* CLIENT_ID     = "esp8266-sitio-1";    // ← esp8266_client_id en la BD
```

| Variable | Dónde ver el valor correcto |
|----------|----------------------------|
| `SITIO_ID` | Columna `id` de la tabla `sitios` |
| `CLIENT_ID` | Columna `esp8266_client_id` del mismo sitio |
| `MQTT_SERVER` | IP local de la PC donde corre Mosquitto |

Por defecto apunta al **sitio 1** (Catarata de Ahuashiyacu). Otros sitios: ver `backend/db/sitios-demo.js`.

### Arduino IDE — ESP8266

1. Instalar core **esp8266** (Gestor de placas).
2. Instalar librería **PubSubClient**.
3. Abrir `esp8266.ino`.
4. Placa: **NodeMCU 1.0 (ESP-12E)** o Generic ESP8266.
5. Subir y abrir Monitor serie a **115200**.

Debe mostrar: IP, `Sitio ID`, `MQTT: ...` y `Conectado`.

---

## esp32cam.ino — qué cambiar

Abre `Firmware/esp32cam.ino` y edita estas líneas al inicio:

```cpp
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";
const char* SERVER_URL    = "http://192.168.1.100:3000";  // ← IP de tu PC + puerto
const int SITIO_ID        = 1;
const char* CLIENT_ID     = "esp32cam-sitio-1";           // ← esp32cam_client_id en la BD
const unsigned long INTERVALO_MS = 250;
```

| Variable | Descripción |
|----------|-------------|
| `SERVER_URL` | `http://IP_DE_TU_PC:3000` (misma IP que `MQTT_SERVER` del ESP8266) |
| `SITIO_ID` | Mismo sitio que el ESP8266 de ese lugar |
| `CLIENT_ID` | Debe coincidir con `esp32cam_client_id` en la BD |
| `INTERVALO_MS` | Milisegundos entre fotos (250 ≈ 4 fps) |

### Arduino IDE — ESP32-CAM

1. Instalar core **esp32** (Gestor de placas).
2. Abrir `esp32cam.ino`.
3. Placa: **AI Thinker ESP32-CAM**.
4. Para programar: conectar **GPIO 0 a GND**, subir, luego quitar GND y pulsar RESET.
5. Monitor serie a **115200**.

Debe mostrar: `Enviando frames a: http://.../api/camara/1/frame`

### Ver la cámara en la web

1. `http://localhost:3000/login`
2. Usuario sitio 1: `seg.ahuashiyacu@iot.local` / `seg123`
3. Panel de Seguridad → video en vivo

---

## Pinout ESP8266

| Componente | GPIO |
|------------|------|
| Puerta 1 — Sensor A | 5 |
| Puerta 1 — Sensor B | 4 |
| Puerta 2 — Sensor A | 14 |
| Puerta 2 — Sensor B | 12 |
| Buzzer | 13 |

---

## Probar sin hardware

**Aforo** (con Mosquitto y backend activos):

```bash
mosquitto_pub -h localhost -t "aforo/1/aforo" -m "25"
```

**Cámara** (con una imagen `foto.jpg`):

```bash
curl -X POST http://localhost:3000/api/camara/1/frame -H "X-Client-Id: esp32cam-sitio-1" -H "Content-Type: image/jpeg" --data-binary @foto.jpg
```

---

## Problemas frecuentes

| Problema | Revisar |
|----------|---------|
| ESP8266 no conecta MQTT | `MQTT_SERVER` = IP del PC, Mosquitto activo, firewall puerto 1883 |
| ESP32 error HTTP | `SERVER_URL` correcto, `npm start` corriendo, misma WiFi |
| HTTP 403 cámara | `CLIENT_ID` ≠ valor en PostgreSQL |
| Aforo no cambia en web | `SITIO_ID` incorrecto o MQTT desconectado |

---

## Checklist

- [ ] WiFi y contraseña en ambos `.ino`
- [ ] IP del PC en `MQTT_SERVER` y `SERVER_URL`
- [ ] `SITIO_ID` y `CLIENT_ID` coinciden con la base de datos
- [ ] `npm start` + Mosquitto activos
- [ ] ESP8266: Serial dice "Conectado"
- [ ] ESP32-CAM: Serial sin errores HTTP constantes
