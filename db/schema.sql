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
