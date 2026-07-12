# Firmware — ESP8266 y ESP32-CAM

Guía para subir el código a los dispositivos y conectarlos al backend Iot-Ayuda.

---

## Antes de flashear

### 1. Servidor en tu PC

En la raíz del proyecto:

```bash
npm install --prefix backend
npm install --prefix frontend
npm run build
npm run db:seed          # si aún no tienes la BD
npm start                # backend en :3000
```

Mosquitto debe estar **corriendo** (puerto 1883).

### 2. IP de tu PC en la red WiFi

En PowerShell:

```powershell
ipconfig
```

Anota la **IPv4** de tu adaptador WiFi (ej. `192.168.1.100`).  
Los ESP no pueden usar `localhost`; deben apuntar a esa IP.

### 3. Qué sitio vas a usar

Por defecto los sketches vienen configurados para **sitio 1** (Catarata de Ahuashiyacu):

| Campo firmware | Valor en BD (`sitios`) |
|----------------|------------------------|
| `SITIO_ID = 1` | `id = 1` |
| ESP8266 `CLIENT_ID` | `esp8266-sitio-1` |
| ESP32 `CLIENT_ID` | `esp32cam-sitio-1` |

Para otro sitio, cambia `SITIO_ID` y ambos `CLIENT_ID` en `config.h` según `backend/db/sitios-demo.js`.

---

## Arduino IDE — librerías

### ESP8266 (NodeMCU / Wemos D1)

1. **Archivo → Preferencias → URLs adicionales:**
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
2. **Herramientas → Placa → Gestor de placas** → instalar **esp8266**.
3. **Herramientas → Administrar bibliotecas** → instalar **PubSubClient** (Nick O'Leary).

### ESP32-CAM (AI-Thinker)

1. **URLs adicionales** (si no tienes ESP32):
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
2. Instalar **esp32** en Gestor de placas.
3. La cámara usa la librería integrada `esp_camera` (no instalar nada extra).

---

## ESP8266 — aforo + MQTT

### Abrir el sketch

```
Firmware/esp8266/esp8266.ino
```

Arduino IDE abre la carpeta `esp8266` automáticamente.

### Configurar `config.h`

Si no existe `config.h`, copia `config.example.h` → `config.h`.

Edita `Firmware/esp8266/config.h`:

```cpp
const char* WIFI_SSID     = "TuRedWiFi";
const char* WIFI_PASSWORD = "tu_clave";
const char* MQTT_SERVER   = "192.168.1.100";  // IP de tu PC
const int SITIO_ID = 1;
const char* CLIENT_ID = "esp8266-sitio-1";
```

### Subir

| Opción | Valor |
|--------|--------|
| Placa | NodeMCU 1.0 (ESP-12E) o Generic ESP8266 |
| Puerto COM | El de tu USB |
| Velocidad | 115200 |

**Monitor serie (115200):** debe mostrar IP, `Sitio ID: 1`, `MQTT: ...` y `Conectado`.

### Probar MQTT sin sensores

Con Mosquitto y el backend activos:

```bash
mosquitto_pub -h localhost -t "aforo/1/aforo" -m "25"
```

El aforo del sitio 1 debe actualizarse en la web.

---

## ESP32-CAM — cámara en vivo

### Cableado para programar

- Conectar **GPIO 0 a GND** antes de enectar USB (modo flash).
- Usar adaptador USB con datos (no solo carga).
- Alimentación estable 5 V recomendada.

### Abrir el sketch

```
Firmware/esp32cam/esp32cam.ino
```

### Configurar `config.h`

```cpp
const char* WIFI_SSID     = "TuRedWiFi";
const char* WIFI_PASSWORD = "tu_clave";
const char* SERVER_URL    = "http://192.168.1.100:3000";
const int SITIO_ID = 1;
const char* CLIENT_ID = "esp32cam-sitio-1";
```

`SERVER_URL` = misma IP del PC + puerto del backend.

### Subir

| Opción | Valor |
|--------|--------|
| Placa | **AI Thinker ESP32-CAM** |
| Puerto COM | COM del adaptador |
| Partition Scheme | Huge APP (si falla por tamaño) |
| PSRAM | Enabled (si aparece la opción) |

Tras subir, **desconecta GPIO 0 de GND** y pulsa RESET.

**Monitor serie:** `Enviando frames a: http://.../api/camara/1/frame`

### Ver la cámara

1. Abre `http://localhost:3000/login`
2. Entra como guardia del sitio 1: `seg.ahuashiyacu@iot.local` / `seg123`  
   (o admin: `admin@iot.local` / `admin123`)
3. Ve a **Panel de Seguridad** → debe verse el video.

---

## Pinout ESP8266 (referencia)

| Componente | GPIO |
|------------|------|
| Puerta 1 — Sensor A | 5 |
| Puerta 1 — Sensor B | 4 |
| Puerta 2 — Sensor A | 14 |
| Puerta 2 — Sensor B | 12 |
| Buzzer | 13 |

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| ESP8266 no conecta MQTT | Verifica IP del PC, firewall Windows (puerto 1883), Mosquitto activo |
| ESP32 error HTTP -1 o timeout | Misma red WiFi, `SERVER_URL` correcto, `npm start` corriendo |
| HTTP 403 en cámara | `CLIENT_ID` no coincide con `esp32cam_client_id` en BD |
| Cámara negra en web | Login como seguridad asignado a ese sitio; revisar Serial del ESP32 |
| Aforo no cambia en web | `SITIO_ID` del firmware ≠ id en BD; revisar topic `aforo/{id}/aforo` |

---

## Checklist rápido

- [ ] PC y ESP en la **misma red WiFi**
- [ ] `ipconfig` → IP puesta en `MQTT_SERVER` y `SERVER_URL`
- [ ] Mosquitto + `npm start` activos
- [ ] `SITIO_ID` y `CLIENT_ID` coinciden con PostgreSQL
- [ ] ESP8266: Serial muestra "Conectado" MQTT
- [ ] ESP32-CAM: Serial sin errores HTTP repetidos
- [ ] Web: sitio 1 muestra aforo y cámara (con login seguridad)
