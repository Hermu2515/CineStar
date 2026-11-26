-- ============================================================================
-- Seed inicial para CineStar
-- Contraseña para todos los usuarios: Cine2026!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- 1. USUARIOS (1 Admin + 2 Clientes)
INSERT INTO usuarios (id, nombre, email, password_hash, rol)
VALUES
  (
    '69776821-50cd-40e1-a29b-6f7bb263e70e',
    'Super Admin',
    'superadmin@cinestar.com',
    crypt('Cine2026!', gen_salt('bf', 10)),
    'ADMIN'
  ),
  (
    '6395657f-3a44-4ccc-8d67-d4eb055bfbad',
    'Ana Gómez',
    'ana@correo.com',
    crypt('Cine2026!', gen_salt('bf', 10)),
    'CLIENTE'
  ),
  (
    '3b9e2c10-7d4a-4f88-9c12-1a2b3c4d5e6f',
    'Carlos Méndez',
    'carlos@correo.com',
    crypt('Cine2026!', gen_salt('bf', 10)),
    'CLIENTE'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. PELÍCULAS
INSERT INTO peliculas (id, titulo, sinopsis, duracion_minutos, clasificacion, genero, estado, poster_url)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Dune: Parte Dos',
    'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
    166,
    'PG-13',
    'Ciencia Ficción',
    'ESTRENO',
    'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Oppenheimer',
    'La historia del físico estadounidense J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
    180,
    'R',
    'Drama Histórico',
    'ESTRENO',
    'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Spider-Man: Beyond the Spider-Verse',
    'Miles Morales enfrenta una nueva amenaza multiversal junto a Gwen Stacy y el equipo de héroes arácnidos.',
    140,
    'PG',
    'Animación',
    'PRE_VENTA',
    'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. FUNCIONES (Horarios relativos a la fecha actual para que nunca caduquen)
INSERT INTO funciones (id, pelicula_id, sala, horario_inicio, horario_fin, precio_entrada, capacidad_total)
VALUES
  (
    '9ae24acb-885a-44e3-8750-45b93b86f262',
    '11111111-1111-4111-8111-111111111111',
    'Sala IMAX 1',
    NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '20 hours 46 minutes',
    8.50,
    50
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'Sala VIP 2',
    NOW() + INTERVAL '1 day' + INTERVAL '21 hours',
    NOW() + INTERVAL '2 days',
    10.00,
    30
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '33333333-3333-4333-8333-333333333333',
    'Sala 3D 3',
    NOW() + INTERVAL '2 days' + INTERVAL '16 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '18 hours 20 minutes',
    7.50,
    60
  )
ON CONFLICT (id) DO NOTHING;

-- 4. RESERVAS DE EJEMPLO (Asientos A1 y A2 ocupados; D1 y D2 quedan libres para la demo)
INSERT INTO reservas (id, usuario_id, funcion_id, total, estado, expira_en)
VALUES
  (
    '77777777-7777-4777-8777-777777777777',
    '6395657f-3a44-4ccc-8d67-d4eb055bfbad',
    '9ae24acb-885a-44e3-8750-45b93b86f262',
    17.00,
    'CONFIRMADA',
    NOW() + INTERVAL '1 day'
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    '3b9e2c10-7d4a-4f88-9c12-1a2b3c4d5e6f',
    '44444444-4444-4444-8444-444444444444',
    10.00,
    'BLOQUEADA',
    NOW() + INTERVAL '5 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. ASIENTOS RESERVADOS
INSERT INTO reserva_asientos (reserva_id, asiento)
VALUES
  ('77777777-7777-4777-8777-777777777777', 'A1'),
  ('77777777-7777-4777-8777-777777777777', 'A2'),
  ('88888888-8888-4888-8888-888888888888', 'B5')
ON CONFLICT (reserva_id, asiento) DO NOTHING;

COMMIT;