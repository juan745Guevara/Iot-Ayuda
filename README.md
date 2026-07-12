# Iot-Ayuda — Monitoreo de Aforo Turístico Multi-Sitio

Sistema de monitoreo de aforo para **varios establecimientos turísticos**. Cada sitio tiene un **ESP8266** (conteo con sensores FC-51) y un **ESP32-CAM** (video en vivo). El **backend** en Node.js conecta **MQTT**, **PostgreSQL** y **Socket.IO**; el **frontend** en React (Vite) ofrece panel público, detalle por sitio y dashboards de seguridad/admin.

---

## Características

- **Multi-sitio**: varios destinos turísticos con aforo independiente
- **Panel público**: cualquier visitante ve el aforo en tiempo real (sin login)
- **Dashboard de seguridad**: cámara en vivo + aforo + alarma por sitio asignado
- **Panel admin**: crear sitios y asignar personal de seguridad
- **Autenticación JWT** con roles: `usuario`, `seguridad`, `admin`
- **MQTT namespaced** por sitio: `aforo/{sitio_id}/...`
- **Streaming de cámara** vía HTTP POST (ESP32-CAM) → Socket.IO (navegador)

---

## Estructura del proyecto

```
Iot-Ayuda/
├── package.json             # Scripts raíz (start, build, db:*)
├── .env.example             # Plantilla de configuración (copiar a .env en la raíz)
├── Firmware/
│   ├── esp8266.ino          # Firmware aforo (2 puertas, FC-51)
│   └── esp32cam.ino         # Firmware cámara (HTTP POST de frames JPEG)
├── backend/                 # API Node.js + MQTT + Socket.IO
│   ├── index.js             # Punto de entrada del servidor
│   ├── config.js            # Variables de entorno (lee .env de la raíz)
│   ├── package.json
│   ├── db/
│   │   ├── schema.sql       # Esquema completo PostgreSQL
│   │   ├── seed.js          # Inicialización (tablas + datos demo)
│   │   ├── sitios-demo.js   # 12 sitios de Tingo María
│   │   ├── seguridad-demo.js
│   │   └── ...
│   ├── routes/              # REST API
│   ├── middleware/          # JWT y roles
│   ├── services/            # aforo-stats (historial, stats diarias)
│   ├── mqtt/                # Cliente MQTT
│   └── socket/              # Rooms Socket.IO
└── frontend/                # React + Vite
    ├── src/
    │   ├── pages/           # Home, Login, SitioDetalle, Seguridad, Admin
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    ├── vite.config.js       # Proxy API + Socket.IO en desarrollo
    └── dist/                # Build de producción (npm run build)
```

---

## Arquitectura

```
┌─────────────┐   MQTT aforo/{id}/aforo   ┌──────────────┐
│  ESP8266    │ ─────────────────────────►│   Mosquitto  │
│  (aforo)    │◄──── alarma / setear ─────│   :1883      │
└─────────────┘                           └──────┬───────┘
                                                 │
┌─────────────┐   HTTP POST JPEG                 │
│  ESP32-CAM  │ ─────────────────────────►┌──────▼───────┐     ┌────────────┐
│  (video)    │                           │  Node.js     │────►│ PostgreSQL │
└─────────────┘                           │  :3000       │     └────────────┘
                                          │ Express+IO   │
                                          └──────┬───────┘
                                                 │ Socket.IO
                                          ┌──────▼───────┐
                                          │  Navegador   │
                                          │  público /   │
                                          │  seguridad   │
                                          └──────────────┘
```

---

## Modelo de datos (PostgreSQL)

| Tabla | Descripción |
|-------|-------------|
| `sitios` | Destinos turísticos con aforo, client IDs de hardware |
| `usuarios` | Usuarios con rol (`usuario`, `seguridad`, `admin`) |
| `seguridad_sitios` | Asignación 1:1 guardia ↔ sitio |
| `historial_aforo` | Registro de cada cambio de aforo (para gráficos) |
| `stats_diario` | Visitas y pico de aforo por día |
| `alertas_aforo` | Alertas al cruzar 60 % y 85 % de capacidad |

### Roles

| Rol | Permisos |
|-----|----------|
| `usuario` | Ver aforo de todos los sitios (público, sin login) |
| `seguridad` | Aforo + cámara + alarma solo en sitios asignados |
| `admin` | Todo lo anterior + gestión de sitios y asignaciones |

---

## Topics MQTT

| Topic | Dirección | Descripción |
|-------|-----------|-------------|
| `aforo/{sitio_id}/aforo` | ESP8266 → servidor | Publica conteo actual |
| `aforo/{sitio_id}/alarma` | servidor → ESP8266 | Activa buzzer 2 s |
| `aforo/{sitio_id}/setear` | servidor → ESP8266 | Ajusta aforo manualmente |

El servidor se suscribe a `aforo/+/aforo` y actualiza la BD + Socket.IO room `sitio_{id}`.

---

## API REST

### Públicas (sin token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/sitios` | Lista sitios activos con aforo |
| GET | `/api/sitios/:id` | Detalle de un sitio |
| GET | `/api/sitios/:id/aforo` | Solo aforo actual/máximo |
| GET | `/api/sitios/:id/estadisticas` | Stats del día (visitas, pico, alertas) |
| GET | `/api/sitios/:id/historial?periodo=dia\|semana\|mes` | Datos para gráfico de historial |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → JWT |

### Seguridad (Bearer token, rol `seguridad` o `admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/seguridad/mis-sitios` | Sitios asignados al usuario |
| GET | `/api/sitios/:id/camara` | Info del stream Socket.IO |

### Cámara (ESP32-CAM, sin JWT)

| Método | Ruta | Headers | Descripción |
|--------|------|---------|-------------|
| POST | `/api/camara/:sitio_id/frame` | `X-Client-Id`, `Content-Type: image/jpeg` | Recibe frame JPEG |

### Admin (Bearer token, rol `admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/sitios` | Lista todos los sitios |
| POST | `/api/admin/sitios` | Crear sitio |
| POST | `/api/admin/asignar-seguridad` | Asignar usuario a sitio |
| GET | `/api/admin/usuarios-seguridad` | Lista personal de seguridad |
| POST | `/api/admin/alarma/:sitio_id` | Enviar alarma MQTT |

---

## Socket.IO

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `join_todos_sitios` | Cliente → servidor | Unirse a todos los rooms de aforo (público) |
| `join_sitio` | Cliente → servidor | Unirse a `sitio_{id}` |
| `aforo` | Servidor → cliente | `{ sitio_id, aforo_actual }` |
| `join_camara` | Cliente → servidor | `{ sitio_id, token }` — valida JWT y asignación |
| `frame` | Servidor → cliente | `{ sitio_id, frame (base64), timestamp }` |
| `alarma` | Cliente → servidor | `{ sitio_id, mensaje }` — publica MQTT alarma |

Rooms:
- `sitio_{id}` — actualizaciones de aforo (público)
- `camara_{id}` — frames de video (solo seguridad/admin autorizado)

---

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Broker MQTT (Mosquitto)
- ESP8266 + 4 sensores FC-51 (2 puertas) por sitio de aforo
- ESP32-CAM (AI-Thinker) por sitio con cámara

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/juan745Guevara/Iot-Ayuda.git
cd Iot-Ayuda
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configurar entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=3000
JWT_SECRET=tu-secreto-seguro
MQTT_BROKER=mqtt://localhost:1883
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iot_ayuda
```

### 3. Crear base de datos

```sql
CREATE DATABASE iot_ayuda;
```

```bash
npm run db:seed
```

Esto crea las tablas y datos de ejemplo:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin@iot.local` | `admin123` | admin |
| `seg.*@iot.local` | `seg123` | seguridad (1 guardia por sitio) |

12 sitios turísticos de la zona de Tingo María (ver `backend/db/sitios-demo.js`).

### 4. Compilar frontend React

```bash
npm run build
```

### 5. Iniciar Mosquitto y el servidor

```bash
npm start
```

**Desarrollo** (backend + hot reload del frontend):

```bash
# Terminal 1
npm start

# Terminal 2
npm run dev:frontend
```

Abrir `http://localhost:5173` (Vite proxy hacia la API en `:3000`).

### Scripts disponibles (desde la raíz)

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el backend en `:3000` |
| `npm run dev:frontend` | Frontend con hot reload en `:5173` |
| `npm run build` | Compila React a `frontend/dist/` |
| `npm run db:seed` | Crea tablas y datos demo |
| `npm run db:add-sitios` | Añade sitios faltantes |
| `npm run db:migrar-seguridad` | Crea cuentas guardia 1:1 |
| `npm run db:migrate-stats` | Tablas de historial + datos iniciales |

### 6. Flashear firmware

**ESP8266** (`Firmware/esp8266.ino`):
- Configurar `SITIO_ID`, `CLIENT_ID`, WiFi y `mqtt_server`
- `SITIO_ID` y `CLIENT_ID` deben coincidir con la tabla `sitios`

**ESP32-CAM** (`Firmware/esp32cam.ino`):
- Configurar `SITIO_ID`, `CLIENT_ID`, `SERVER_URL` y WiFi
- `CLIENT_ID` debe coincidir con `esp32cam_client_id` en la BD

---

## Páginas web (React)

| URL | Acceso | Descripción |
|-----|--------|-------------|
| `/` | Público | Listado con búsqueda, filtros y stats en tiempo real |
| `/sitio/:id` | Público | Gauge, estadísticas del día e historial gráfico |
| `/login` | Público | Login para seguridad y admin |
| `/seguridad` | Seguridad/Admin | Cámara en vivo + aforo + alarma |
| `/admin` | Admin | Crear sitios y asignar guardias (1:1) |

En producción, Express sirve `frontend/dist/` y hace fallback SPA para todas las rutas.

---

## Historial de aforo

Cada vez que el ESP8266 publica un cambio por MQTT (`aforo/{id}/aforo`), el backend guarda una fila en `historial_aforo`. El gráfico de `/sitio/:id` consulta esa tabla agrupada por hora (día), o por día (semana/mes).

---

## Probar cámara sin ESP32-CAM

Simular un frame JPEG con curl:

```bash
curl -X POST http://localhost:3000/api/camara/1/frame \
  -H "X-Client-Id: esp32cam-sitio-1" \
  -H "Content-Type: image/jpeg" \
  --data-binary @foto.jpg
```

Con el dashboard de seguridad abierto y logueado, debería aparecer la imagen.

---

## Hardware ESP8266 (sin cambios de pinout)

| Componente | GPIO |
|------------|------|
| Puerta 1 — Sensor A | 5 |
| Puerta 1 — Sensor B | 4 |
| Puerta 2 — Sensor A | 14 |
| Puerta 2 — Sensor B | 12 |
| Buzzer | 13 |

---

## Fuera de alcance (por ahora)

- Grabación de video en disco/BD
- Notificaciones push
- Analítica avanzada
- Microservicios

---

## Licencia

ISC
