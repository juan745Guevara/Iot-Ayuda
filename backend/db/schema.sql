-- Esquema PostgreSQL para Iot-Ayuda multi-sitio

CREATE TABLE IF NOT EXISTS sitios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(200),
  aforo_maximo INT DEFAULT 50,
  aforo_actual INT DEFAULT 0,
  esp8266_client_id VARCHAR(50) UNIQUE,
  esp32cam_client_id VARCHAR(50) UNIQUE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('usuario', 'seguridad', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seguridad_sitios (
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  sitio_id INT REFERENCES sitios(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, sitio_id)
);

-- Historial y estadísticas de aforo
CREATE TABLE IF NOT EXISTS historial_aforo (
  id SERIAL PRIMARY KEY,
  sitio_id INT REFERENCES sitios(id) ON DELETE CASCADE,
  aforo_actual INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_sitio_fecha ON historial_aforo (sitio_id, recorded_at);

CREATE TABLE IF NOT EXISTS stats_diario (
  sitio_id INT REFERENCES sitios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  visitas INT DEFAULT 0,
  aforo_maximo_dia INT DEFAULT 0,
  PRIMARY KEY (sitio_id, fecha)
);

CREATE TABLE IF NOT EXISTS alertas_aforo (
  id SERIAL PRIMARY KEY,
  sitio_id INT REFERENCES sitios(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('moderado', 'lleno')),
  aforo_actual INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_sitio_fecha ON alertas_aforo (sitio_id, created_at);
