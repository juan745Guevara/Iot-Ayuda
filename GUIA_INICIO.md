# Guía de arranque — Iot-Ayuda

Esta guía explica **paso a paso** cómo poner en marcha el proyecto en tu PC: base de datos, servidor, web y (opcional) dispositivos IoT.

> **Documentación relacionada**
> - [README.md](README.md) — visión general, API y arquitectura
> - [Firmware/FLASHEO.md](Firmware/FLASHEO.md) — subir código al ESP8266 y ESP32-CAM

---

## ¿Qué necesitas tener instalado?

| Software | Para qué sirve | Cómo comprobar |
|----------|----------------|----------------|
| **Node.js 18+** | Backend y build del frontend | `node -v` |
| **PostgreSQL 14+** | Base de datos de sitios, usuarios e historial | Servicio corriendo en Windows |
| **Mosquitto** | Broker MQTT (comunicación con ESP8266) | `net start mosquitto` o servicio activo |
| **Git** (opcional) | Clonar el repositorio | `git -v` |

Para flashear hardware IoT además necesitas **Arduino IDE** (pasos en [Firmware/FLASHEO.md](Firmware/FLASHEO.md)).

---

## Vista rápida: ¿qué se levanta y en qué puerto?

| Servicio | Puerto | Quién lo usa |
|----------|--------|--------------|
| Backend Node.js | **3000** | API REST + Socket.IO + sirve la web compilada |
| Frontend dev (Vite) | **5173** | Solo en modo desarrollo (hot reload) |
| PostgreSQL | **5432** | Backend |
| Mosquitto MQTT | **1883** | Backend ↔ ESP8266 |

---

## Primera vez — configuración completa

### Paso 1: Obtener el código

```bash
git clone https://github.com/juan745Guevara/Iot-Ayuda.git
cd Iot-Ayuda
```

Si ya tienes la carpeta, entra con `cd Iot-Ayuda`.

### Paso 2: Instalar dependencias

Desde la **raíz** del proyecto:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### Paso 3: Crear el archivo `.env`

Copia la plantilla:

```bash
copy .env.example .env
```

En PowerShell también puedes usar: `Copy-Item .env.example .env`

Edita `.env` en la raíz con tus datos reales:

```env
PORT=3000
JWT_SECRET=un-secreto-largo-y-unico
MQTT_BROKER=mqtt://localhost:1883
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/iot_ayuda
```

| Variable | Qué poner |
|----------|-----------|
| `PORT` | Puerto del servidor web (dejar `3000` salvo conflicto) |
| `JWT_SECRET` | Cualquier cadena segura (login de seguridad/admin) |
| `MQTT_BROKER` | `mqtt://localhost:1883` si Mosquitto está en tu PC |
| `DATABASE_URL` | Usuario, contraseña y nombre de BD de PostgreSQL |

**Ejemplo** si tu postgres usa contraseña `123456`:

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/iot_ayuda
```

### Paso 4: Crear la base de datos

Abre **pgAdmin**, **psql** o la herramienta que uses y ejecuta:

```sql
CREATE DATABASE iot_ayuda;
```

### Paso 5: Cargar tablas y datos de demostración

```bash
npm run db:seed
```

Esto crea:

- Tablas (`sitios`, `usuarios`, `historial_aforo`, etc.)
- **12 sitios turísticos** de Tingo María
- **1 admin** y **12 guardias** (uno por sitio)

Si ves errores de conexión, revisa que PostgreSQL esté activo y que `DATABASE_URL` sea correcta.

### Paso 6: Compilar el frontend

```bash
npm run build
```

Genera la carpeta `frontend/dist/` que el backend sirve en producción.

### Paso 7: Iniciar Mosquitto

Asegúrate de que el broker MQTT esté corriendo. En Windows:

```powershell
net start mosquitto
```

Si ya está activo, no hace falta repetirlo.

### Paso 8: Arrancar el servidor

```bash
npm start
```

Deberías ver algo como:

```
Servidor ejecutándose en http://localhost:3000
Conectado al Broker MQTT
```

### Paso 9: Abrir la aplicación

Navegador: **http://localhost:3000**

Deberías ver el listado de sitios turísticos con aforo.

---

## Cuentas de prueba

| Rol | Email | Contraseña | Acceso |
|-----|-------|------------|--------|
| **Admin** | `admin@iot.local` | `admin123` | `/admin` — gestionar sitios |
| **Seguridad sitio 1** | `seg.ahuashiyacu@iot.local` | `seg123` | `/seguridad` — cámara + alarma sitio 1 |
| **Seguridad sitio N** | `seg.*@iot.local` | `seg123` | Un guardia por cada sitio |

El listado completo de emails está en `backend/db/seguridad-demo.js`.

---

## Modos de trabajo

### Modo producción local (recomendado para probar “como usuario final”)

Un solo terminal:

```bash
npm run build    # solo si cambiaste el frontend
npm start
```

Abre **http://localhost:3000**

### Modo desarrollo (si vas a editar React)

Dos terminales:

```bash
# Terminal 1 — backend
npm start

# Terminal 2 — frontend con recarga automática
npm run dev:frontend
```

Abre **http://localhost:5173** (Vite redirige API y Socket.IO al puerto 3000).

Si cambias código del **backend**, reinicia `npm start`.

---

## Páginas de la aplicación

| URL | ¿Login? | Descripción |
|-----|---------|-------------|
| http://localhost:3000/ | No | Inicio — todos los sitios en tiempo real |
| http://localhost:3000/sitio/1 | No | Detalle del sitio 1 (gauge, historial) |
| http://localhost:3000/login | No | Entrada para personal |
| http://localhost:3000/seguridad | Sí | Panel guardia — cámara y alarma |
| http://localhost:3000/admin | Sí (admin) | Crear sitios y asignar guardias |

---

## Cómo comprobar que todo funciona (sin hardware)

### 1. API de sitios

```bash
curl http://localhost:3000/api/sitios
```

Debe devolver JSON con la lista de sitios.

### 2. Simular cambio de aforo por MQTT

Con Mosquitto y `npm start` activos:

```bash
mosquitto_pub -h localhost -t "aforo/1/aforo" -m "30"
```

Recarga la web: el sitio 1 debe mostrar aforo **30** sin recargar manualmente (Socket.IO).

### 3. Simular cámara sin ESP32-CAM

Con una imagen `foto.jpg`:

```bash
curl -X POST http://localhost:3000/api/camara/1/frame -H "X-Client-Id: esp32cam-sitio-1" -H "Content-Type: image/jpeg" --data-binary @foto.jpg
```

Luego entra a `/seguridad` como `seg.ahuashiyacu@iot.local` / `seg123` y debería verse el frame.

---

## Conectar hardware IoT (ESP8266 + ESP32-CAM)

El firmware está en `Firmware/` — **solo dos archivos** `.ino`, sin carpetas ni `config.h`:

```
Firmware/
├── esp8266.ino    ← aforo + MQTT
├── esp32cam.ino   ← cámara en vivo
└── FLASHEO.md     ← guía detallada de Arduino IDE
```

Antes de flashear, asegúrate de tener **`npm start`**, **Mosquitto** y **PostgreSQL** activos (pasos anteriores de esta guía).

Los microcontroladores **no usan `localhost`**. Deben apuntar a la **IP de tu PC** en la red WiFi.

### Paso 1 — Obtener la IP del PC

```powershell
ipconfig
```

Anota la **IPv4** del adaptador WiFi (ej. `192.168.1.100`).

### Paso 2 — Editar la CONFIGURACIÓN en cada `.ino`

Abre cada archivo en un editor de texto o Arduino IDE y cambia la sección **CONFIGURACIÓN** al inicio del archivo:

**`Firmware/esp8266.ino`**

| Variable | Qué poner |
|----------|-----------|
| `WIFI_SSID` / `WIFI_PASSWORD` | Tu red WiFi |
| `MQTT_SERVER` | IP del PC (ej. `192.168.1.100`) |
| `SITIO_ID` | `id` del sitio en PostgreSQL (por defecto `1`) |
| `CLIENT_ID` | `esp8266_client_id` del mismo sitio en la BD |

**`Firmware/esp32cam.ino`**

| Variable | Qué poner |
|----------|-----------|
| `WIFI_SSID` / `WIFI_PASSWORD` | Tu red WiFi |
| `SERVER_URL` | `http://IP_DEL_PC:3000` (misma IP que arriba) |
| `SITIO_ID` | Mismo sitio que el ESP8266 de ese lugar |
| `CLIENT_ID` | `esp32cam_client_id` del sitio en la BD |

Los valores por defecto apuntan al **sitio 1** (Catarata de Ahuashiyacu). Otros sitios: `backend/db/sitios-demo.js`.

### Paso 3 — Subir con Arduino IDE

1. Abre `esp8266.ino` o `esp32cam.ino` en Arduino IDE (no hace falta carpeta aparte).
2. Instala el core correspondiente (**esp8266** o **esp32**) y, para el ESP8266, la librería **PubSubClient**.
3. Sube el sketch al dispositivo.

Instrucciones completas (placas, GPIO 0 en ESP32-CAM, monitor serie, etc.): **[Firmware/FLASHEO.md](Firmware/FLASHEO.md)**.

### Paso 4 — Verificar

| Dispositivo | Monitor serie (115200) | En la web |
|-------------|------------------------|-----------|
| ESP8266 | `Conectado` MQTT | Aforo del sitio cambia al pasar sensores |
| ESP32-CAM | Sin errores HTTP repetidos | `/seguridad` con guardia del sitio → video en vivo |

Login de prueba sitio 1: `seg.ahuashiyacu@iot.local` / `seg123`

### Checklist rápido

- [ ] WiFi y contraseña en ambos `.ino`
- [ ] IP del PC en `MQTT_SERVER` y `SERVER_URL`
- [ ] `SITIO_ID` y `CLIENT_ID` coinciden con la base de datos
- [ ] `npm start` + Mosquitto activos
- [ ] PC y ESP en la misma red WiFi

---

## Scripts útiles (desde la raíz)

| Comando | Cuándo usarlo |
|---------|----------------|
| `npm start` | Arrancar el backend |
| `npm run dev:frontend` | Frontend en desarrollo (:5173) |
| `npm run build` | Compilar React antes de producción |
| `npm run db:seed` | Primera vez o resetear datos demo |
| `npm run db:add-sitios` | Añadir sitios nuevos del catálogo demo |
| `npm run db:migrar-seguridad` | Recrear cuentas guardia 1:1 |
| `npm run db:migrate-stats` | Tablas de historial en BD antigua |

---

## Orden recomendado cada vez que enciendes el PC

```
1. PostgreSQL  → servicio activo
2. Mosquitto   → net start mosquitto  (si no está en automático)
3. Terminal    → cd Iot-Ayuda
4. Terminal    → npm start
5. Navegador   → http://localhost:3000
```

Si trabajas en frontend:

```
6. Otra terminal → npm run dev:frontend
7. Navegador     → http://localhost:5173
```

---

## Problemas frecuentes

### `Error: listen EADDRINUSE :::3000`

Ya hay otro proceso en el puerto 3000. Cierra la terminal anterior con `npm start` o mata el proceso Node.

### `Error al inicializar BD` / conexión PostgreSQL

- PostgreSQL está apagado → inícialo desde Servicios de Windows.
- Contraseña incorrecta en `DATABASE_URL`.
- La base `iot_ayuda` no existe → créala con `CREATE DATABASE`.

### `Error MQTT` en consola del servidor

- Mosquitto no está corriendo → `net start mosquitto`.
- `MQTT_BROKER` mal escrito en `.env`.

### La web carga pero sin sitios / error 500

- Ejecuta `npm run db:seed`.
- Revisa la consola del backend para el error exacto.

### Cambios en React no se ven en :3000

Ejecuta `npm run build` y reinicia `npm start`. En desarrollo usa `:5173` con `npm run dev:frontend`.

### ESP8266 no conecta / aforo no actualiza

- Misma red WiFi que el PC.
- `MQTT_SERVER` en `esp8266.ino` = IP del PC, no `localhost`.
- Firewall de Windows puede bloquear puerto **1883**.

### Cámara no se ve en /seguridad

- Login con guardia **asignado a ese sitio**.
- `CLIENT_ID` en `esp32cam.ino` = `esp32cam_client_id` en la BD.
- `SERVER_URL` en `esp32cam.ino` correcto (`http://IP:3000`) y `npm start` activo.

---

## Estructura de carpetas (recordatorio)

```
Iot-Ayuda/
├── .env                 ← configuración (no subir a git con secretos reales)
├── package.json         ← scripts npm desde aquí
├── GUIA_INICIO.md       ← esta guía
├── README.md            ← documentación técnica y API
├── backend/             ← servidor Node.js
├── frontend/            ← React (código fuente)
└── Firmware/
    ├── esp8266.ino      ← editar CONFIGURACIÓN y subir al ESP8266
    ├── esp32cam.ino     ← editar CONFIGURACIÓN y subir al ESP32-CAM
    └── FLASHEO.md       ← guía de flasheo con Arduino IDE
```

---

## Resumen en 6 comandos (instalación limpia)

```bash
cd Iot-Ayuda
npm install --prefix backend
npm install --prefix frontend
copy .env.example .env
# → editar .env con tu contraseña de PostgreSQL
# → crear BD: CREATE DATABASE iot_ayuda;
npm run db:seed
npm run build
npm start
```

Abre **http://localhost:3000** y listo.

---

## Siguiente paso

1. Comprueba que **http://localhost:3000** muestra los sitios y que MQTT/cámara simulados funcionan (sección anterior).
2. Edita `Firmware/esp8266.ino` y `Firmware/esp32cam.ino` (sección **Conectar hardware IoT**).
3. Para el flasheo con Arduino IDE, pinout y problemas frecuentes del firmware → **[Firmware/FLASHEO.md](Firmware/FLASHEO.md)**.
