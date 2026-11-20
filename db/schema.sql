CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('CLIENTE', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peliculas (
  id UUID PRIMARY KEY,
  titulo VARCHAR(160) NOT NULL,
  sinopsis TEXT NOT NULL,
  duracion_minutos INT NOT NULL CHECK (duracion_minutos > 0),
  clasificacion VARCHAR(20) NOT NULL,
  genero VARCHAR(60) NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('ESTRENO', 'PRE_ESTRENO', 'PREVENTA')),
  poster_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funciones (
  id UUID PRIMARY KEY,
  pelicula_id UUID NOT NULL REFERENCES peliculas(id) ON DELETE RESTRICT,
  sala VARCHAR(60) NOT NULL,
  horario_inicio TIMESTAMPTZ NOT NULL,
  horario_fin TIMESTAMPTZ NOT NULL,
  precio_entrada NUMERIC(10, 2) NOT NULL CHECK (precio_entrada > 0),
  capacidad_total INT NOT NULL CHECK (capacidad_total > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (horario_fin > horario_inicio)
);

CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  funcion_id UUID NOT NULL REFERENCES funciones(id) ON DELETE RESTRICT,
  total NUMERIC(10, 2) NOT NULL CHECK (total > 0),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('BLOQUEADA', 'CONFIRMADA')),
  expira_en TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reserva_asientos (
  reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  asiento VARCHAR(10) NOT NULL,
  PRIMARY KEY (reserva_id, asiento)
);