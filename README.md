# Iot-Ayuda — Control de aforo

Sistema de conteo de personas (**aforo**) basado en IoT. Utiliza un **ESP8266** con sensores infrarrojos en dos puertas independientes, un **broker MQTT** como bus de mensajes y un **servidor Node.js** con panel web para monitoreo y alertas en tiempo real.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Hardware](#hardware)
- [Firmware ESP8266](#firmware-esp8266)
- [Servidor web (Node.js)](#servidor-web-nodejs)
- [Panel web](#panel-web)
- [Topics MQTT](#topics-mqtt)
- [Requisitos](#requisitos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Configuración](#configuración)
- [Uso](#uso)
- [Lógica de conteo (máquina de estados)](#lógica-de-conteo-máquina-de-estados)
- [Estado actual y pendientes](#estado-actual-y-pendientes)

---

## Descripción general

El sistema detecta el paso de personas por **dos puertas**, cada una equipada con **dos sensores FC-51** colocados en secuencia. Según el orden en que se activan los sensores, se determina si la persona **entra** o **sale**, actualizando un contador global de aforo.

El valor del aforo se publica por **MQTT** y se muestra en un navegador web mediante **Socket.IO**. Desde el panel también se puede enviar una señal de **alarma** que activa un **buzzer** conectado al ESP8266.

---

## Estructura del repositorio

```
Iot-Ayuda/
├── esp8266.ino          # Firmware para ESP8266 (Arduino IDE / PlatformIO)
├── index.js             # Servidor Node.js: Express + Socket.IO + cliente MQTT
├── package.json         # Dependencias y metadatos del proyecto Node
├── package-lock.json    # Lockfile de dependencias npm
├── public/
│   └── index.html       # Panel web de monitoreo y alertas
└── README.md            # Este archivo
```

| Archivo | Rol |
|---------|-----|
| `esp8266.ino` | Lectura de sensores, lógica de aforo, conexión WiFi/MQTT, control del buzzer |
| `index.js` | Puente MQTT ↔ navegador; sirve el frontend estático |
| `public/index.html` | Interfaz para ver el aforo y enviar alertas |
| `package.json` | Proyecto npm `aforo-tingo-maria` v1.0.0 |

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         HARDWARE                                │
│  Puerta 1 (FC-51 A,B) ──┐                                       │
│  Puerta 2 (FC-51 A,B) ──┼──► ESP8266 ──► Buzzer (GPIO 13)       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ WiFi
                          ▼
              ┌───────────────────────┐
              │   Broker MQTT         │
              │   (puerto 1883)       │
              │   IP: 192.168.100.3   │
              └───────────┬───────────┘
                          │
          publish/subscribe│
                          ▼
              ┌───────────────────────┐
              │   Node.js (:3000)     │
              │   Express + Socket.IO │
              │   + cliente MQTT      │
              └───────────┬───────────┘
                          │ WebSocket
                          ▼
              ┌───────────────────────┐
              │   Navegador web       │
              │   public/index.html   │
              └───────────────────────┘
```

**Flujo de datos:**

1. El ESP8266 lee los sensores y actualiza el contador `aforo`.
2. Cuando el aforo cambia, publica en el topic `aforo`.
3. El servidor Node.js está suscrito a `aforo` y reenvía el valor al navegador vía Socket.IO.
4. El usuario pulsa **Alerta** en el panel → el servidor publica en `alarma` → el ESP8266 activa el buzzer.

---

## Hardware

### Microcontrolador

- **ESP8266** (NodeMCU, Wemos D1 Mini u otra placa compatible)
- Firmware en `esp8266.ino`

> **Nota:** `package.json` menciona ESP32, pero el código actual está escrito para **ESP8266**.

### Sensores

- **FC-51** (módulo infrarrojo de obstáculos)
- Lógica: sensor **activo en LOW** (`digitalRead == LOW`)
- Modo de pin: `INPUT_PULLUP`

### Conexión de pines

| Componente | GPIO ESP8266 | Constante en código |
|------------|--------------|---------------------|
| Puerta 1 — Sensor A | 5 (D1) | `P1_A` |
| Puerta 1 — Sensor B | 4 (D2) | `P1_B` |
| Puerta 2 — Sensor A | 14 (D5) | `P2_A` |
| Puerta 2 — Sensor B | 12 (D6) | `P2_B` |
| Buzzer | 13 (D7) | `BUZZER` |

### Disposición recomendada por puerta

Colocar los sensores **en línea**, uno detrás del otro en la dirección del paso:

```
  [Sensor A]  ──────►  [Sensor B]
       Entrada              Salida
```

- **A primero, luego B** → se cuenta como **ingreso** (`aforo++`)
- **B primero, luego A** → se cuenta como **salida** (`aforo--`)

---

## Firmware ESP8266

**Archivo:** `esp8266.ino`

### Librerías requeridas

- `ESP8266WiFi` (incluida en el core ESP8266 para Arduino)
- `PubSubClient` (instalar desde el Gestor de librerías de Arduino)

### Funciones principales

| Función | Descripción |
|---------|-------------|
| `procesarPuerta()` | Máquina de estados por puerta; actualiza `aforo` |
| `callback()` | Recibe mensajes MQTT (`alarma`, `setear`) |
| `reconnect()` | Reconexión al broker MQTT |
| `setup()` | Inicializa pines, WiFi y MQTT |
| `loop()` | Procesa MQTT, ambas puertas y publica cambios de aforo |

### Variables clave

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `aforo` | `int` | Contador actual de personas |
| `aforo_actual` | `int` | Último valor publicado/sincronizado |
| `TIMEOUT` | `8000 ms` | Tiempo máximo con persona entre sensores |
| `puerta1`, `puerta2` | `struct Puerta` | Estado independiente por puerta |

### Serial Monitor

- Velocidad: **115200 baud**
- Mensajes de depuración: `Ingreso Aforo = X`, `Salida Aforo = X`, estado WiFi/MQTT

---

## Servidor web (Node.js)

**Archivo:** `index.js`

### Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^5.2.1 | Servidor HTTP y archivos estáticos |
| `socket.io` | ^4.8.3 | Comunicación en tiempo real con el navegador |
| `mqtt` | ^5.15.2 | Cliente MQTT hacia el broker |

### Responsabilidades

- Conectarse al broker MQTT (`mqtt://localhost:1883` por defecto)
- Suscribirse al topic `aforo`
- Reenviar mensajes de aforo al frontend con `io.emit("aforo", ...)`
- Recibir eventos `alarma` del navegador y publicarlos en MQTT
- Servir `public/` como contenido estático
- Escuchar en el puerto **3000**

### Arranque

```bash
npm install
node index.js
```

Salida esperada:

```
✅ Conectado al Broker MQTT
Servidor ejecutándose en http://localhost:3000
```

---

## Panel web

**Archivo:** `public/index.html`

### Características actuales

- Conexión automática a Socket.IO
- Área de mensajes que muestra los valores de aforo recibidos
- Campo de texto y botón **Alerta** para publicar en el topic `alarma`
- Diseño simple con tarjeta blanca sobre fondo gris claro

### Eventos Socket.IO

| Evento | Dirección | Payload | Acción |
|--------|-----------|---------|--------|
| `aforo` | Servidor → Cliente | `{ message: "N" }` | Muestra el aforo en pantalla |
| `alarma` | Cliente → Servidor | `{ message: "..." }` | Publica en MQTT topic `alarma` |

---

## Topics MQTT

| Topic | Publicado por | Suscrito por | Payload | Efecto |
|-------|---------------|--------------|---------|--------|
| `aforo` | ESP8266 | Node.js | Número como string (`"5"`) | Actualiza el panel web |
| `alarma` | Node.js (desde web) | ESP8266 | Cualquier texto | Buzzer ON 2 segundos |
| `setear` | *(no implementado en servidor)* | *(no suscrito en ESP)* | Número | En firmware: fija `aforo` manualmente |
| `reinicio` | *(no implementado)* | ESP8266 *(suscrito, sin handler)* | — | Sin efecto actual |

---

## Requisitos

### Software

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [Arduino IDE](https://www.arduino.cc/) o PlatformIO con soporte ESP8266
- Librería **PubSubClient** para Arduino
- **Broker MQTT** (Mosquitto, EMQX, etc.) accesible en la red local

### Red

- ESP8266 y PC/servidor en la **misma red WiFi**
- Broker MQTT en `192.168.100.3:1883` (configurable)
- Puerto 3000 libre en la máquina que ejecuta Node.js

---

## Instalación y puesta en marcha

### 1. Broker MQTT

Instalar y ejecutar un broker en la IP configurada (ejemplo con Mosquitto en Linux):

```bash
sudo apt install mosquitto
sudo systemctl start mosquitto
```

En Windows, instalar Mosquitto y asegurarse de que escucha en el puerto **1883**.

### 2. Servidor Node.js

```bash
cd Iot-Ayuda
npm install
node index.js
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

### 3. Firmware ESP8266

1. Abrir `esp8266.ino` en Arduino IDE
2. Seleccionar placa **ESP8266** y el puerto COM correcto
3. Editar credenciales WiFi y IP del broker (ver [Configuración](#configuración))
4. Compilar y subir al microcontrolador
5. Abrir el Monitor Serie a **115200** para verificar conexión

### 4. Verificación

1. El ESP debe mostrar IP asignada y `Conectado a la red!`
2. Debe conectarse al MQTT: `Conectando MQTT... Conectado`
3. Al pasar por una puerta, el aforo debe cambiar en Serial y en el panel web
4. Al pulsar **Alerta** en el panel, el buzzer debe sonar 2 segundos

---

## Configuración

### ESP8266 (`esp8266.ino`)

```cpp
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_CONTRASEÑA";
const char* mqtt_server = "192.168.100.3";  // IP del broker MQTT
```

| Parámetro | Valor por defecto | Descripción |
|-----------|-------------------|-------------|
| `TIMEOUT` | `8000` ms | Reset parcial si alguien se detiene entre sensores |
| Puerto MQTT | `1883` | Puerto estándar MQTT |
| Client ID MQTT | `ESP8266Client` | Identificador del dispositivo en el broker |

### Servidor Node.js (`index.js`)

```js
const MQTT_BROKER = "mqtt://localhost:1883";  // Cambiar si el broker no está en la misma máquina
const PORT = 3000;
```

> Si el broker corre en otra máquina (ej. `192.168.100.3`), cambiar a:
> `mqtt://192.168.100.3:1883`

---

## Uso

### Monitoreo de aforo

1. Encender el ESP8266 con sensores conectados
2. Ejecutar `node index.js`
3. Abrir `http://localhost:3000`
4. Los valores de aforo aparecerán automáticamente al detectar entradas/salidas

### Enviar alarma

1. En el panel web, opcionalmente escribir un mensaje
2. Pulsar **Alerta**
3. El ESP8266 activará el buzzer durante 2 segundos

### Depuración por Serial

Conectar el ESP8266 por USB y observar:

```
Ingreso   Aforo = 1
Salida    Aforo = 0
```

---

## Lógica de conteo (máquina de estados)

Cada puerta mantiene su propio estado:

```
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
           A activo      │      B activo
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌──────────┐           ┌──────────┐
        │ A_FIRST  │           │ B_FIRST  │
        └────┬─────┘           └────┬─────┘
     A y B activos            A y B activos
              ▼                     ▼
     ┌──────────────┐        ┌──────────────┐
     │ BOTH_FROM_A  │        │ BOTH_FROM_B  │
     │  (entrada)   │        │   (salida)   │
     └──────┬───────┘        └──────┬───────┘
            │ ambos libres          │ ambos libres
            ▼                       ▼
        aforo++                  aforo--
            └──────────► IDLE ◄──────────┘
```

### Timeout (8 segundos)

Si una persona se detiene entre sensores y solo uno queda activo tras el timeout, la puerta vuelve a `IDLE`. Si siguen ocupados ambos sensores, el sistema espera hasta que se muevan.

---

## Estado actual y pendientes

Funcionalidades **implementadas**:

- [x] Conteo bidireccional en 2 puertas independientes
- [x] Publicación MQTT del aforo al cambiar
- [x] Panel web con actualización en tiempo real
- [x] Alarma sonora remota vía MQTT
- [x] Reconexión automática MQTT en el ESP8266
- [x] Timeout anti-bloqueo entre sensores

Funcionalidades **parciales o pendientes**:

- [ ] Topic `setear`: el firmware tiene handler pero **no está suscrito** al topic
- [ ] Topic `reinicio`: el ESP está suscrito pero **no tiene lógica** asociada
- [ ] UI para ajustar el aforo manualmente desde el panel web
- [ ] Variables de entorno (`.env`) para credenciales WiFi y URLs MQTT
- [ ] Script `npm start` en `package.json`
- [ ] Corrección de metadatos: `package.json` indica ESP32 en lugar de ESP8266

### Recomendaciones de seguridad

- No subir credenciales WiFi al repositorio; usar un archivo de configuración local ignorado por git
- Considerar autenticación MQTT si el broker es accesible desde otras redes

---

## Licencia

ISC — ver `package.json`.

---

## Autor

Proyecto **aforo-tingo-maria** — control de aforo con microcontroladores.
