import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const servers = [];

function createFakePool() {
  const usuarios = [];
  const peliculas = [];
  const funciones = [];
  const reservas = [];
  const reservaAsientos = [];

  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    const upper = normalized.toUpperCase();

    if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
      return { rows: [] };
    }

    if (upper.startsWith('INSERT INTO USUARIOS')) {
      const row = {
        id: params[0],
        nombre: params[1],
        email: params[2],
        password_hash: params[3],
        rol: params[4],
        created_at: params[5],
      };
      usuarios.push(row);
      return { rows: [row] };
    }

    if (upper.includes('FROM USUARIOS WHERE EMAIL = $1')) {
      const user = usuarios.find((u) => u.email === params[0]);
      return { rows: user ? [user] : [] };
    }

    if (upper.includes('FROM USUARIOS WHERE ID = $1')) {
      const user = usuarios.find((u) => u.id === params[0]);
      return { rows: user ? [user] : [] };
    }

    if (upper.startsWith('INSERT INTO PELICULAS')) {
      const row = {
        id: params[0],
        titulo: params[1],
        sinopsis: params[2],
        duracion_minutos: params[3],
        clasificacion: params[4],
        genero: params[5],
        estado: params[6],
        poster_url: params[7],
        created_at: params[8],
      };
      peliculas.push(row);
      return { rows: [row] };
    }

    if (upper.includes('FROM PELICULAS WHERE ID = $1')) {
      const pelicula = peliculas.find((p) => p.id === params[0]);
      return { rows: pelicula ? [pelicula] : [] };
    }

    if (upper.includes('FROM PELICULAS')) {
      return { rows: [...peliculas] };
    }

    if (upper.startsWith('INSERT INTO FUNCIONES')) {
      const row = {
        id: params[0],
        pelicula_id: params[1],
        sala: params[2],
        horario_inicio: params[3],
        horario_fin: params[4],
        precio_entrada: params[5],
        capacidad_total: params[6],
        created_at: params[7],
      };
      funciones.push(row);
      return { rows: [row] };
    }

    if (upper.includes('FROM FUNCIONES WHERE ID = $1')) {
      const funcion = funciones.find((f) => f.id === params[0]);
      return { rows: funcion ? [funcion] : [] };
    }

    if (upper.includes('FROM FUNCIONES')) {
      return { rows: [...funciones] };
    }

    if (upper.startsWith('INSERT INTO RESERVAS')) {
      const row = {
        id: params[0],
        usuario_id: params[1],
        funcion_id: params[2],
        total: params[3],
        estado: params[4],
        expira_en: params[5],
        created_at: params[6],
      };
      reservas.push(row);
      return { rows: [row] };
    }

    if (upper.startsWith('INSERT INTO RESERVA_ASIENTOS')) {
      reservaAsientos.push({ reserva_id: params[0], asiento: params[1] });
      return { rows: [] };
    }

    if (upper.startsWith('UPDATE RESERVAS')) {
      const reserva = reservas.find((r) => r.id === params[0]);
      if (!reserva) return { rows: [] };
      reserva.estado = params[1] || 'CONFIRMADA';
      return { rows: [{ id: reserva.id }] };
    }

    if (upper.startsWith('DELETE FROM RESERVAS')) {
      const idx = reservas.findIndex((r) => r.id === params[0]);
      if (idx === -1) return { rows: [] };
      const [removed] = reservas.splice(idx, 1);
      for (let i = reservaAsientos.length - 1; i >= 0; i -= 1) {
        if (reservaAsientos[i].reserva_id === removed.id) {
          reservaAsientos.splice(i, 1);
        }
      }
      return { rows: [{ id: removed.id }] };
    }

    if (upper.includes('FROM RESERVAS')) {
      const list = upper.includes('WHERE R.ID = $1') || upper.includes('WHERE ID = $1')
        ? reservas.filter((r) => r.id === params[0])
        : reservas;

      const rows = list.map((r) => ({
        ...r,
        asientos: reservaAsientos
          .filter((ra) => ra.reserva_id === r.id)
          .map((ra) => ra.asiento)
          .sort(),
      }));
      return { rows };
    }

    throw new Error(`Consulta SQL no soportada en FakePool: ${normalized}`);
  }

  return {
    query,
    async connect() {
      return { query, release() {} };
    },
  };
}

async function startApi() {
  const pool = createFakePool();
  const server = createApp(pool, 'test-secret-key').listen(0);
  servers.push(server);

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address();
  return { baseUrl: `http://127.0.0.1:${address.port}` };
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise((resolve) => server.close(() => resolve()))),
  );
});

describe('API HTTP CineStar y contrato OpenAPI', () => {
  it('responde 200 en GET /health', async () => {
    const { baseUrl } = await startApi();
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok' });
  });

  it('ejecuta los flujos principales (R-02, CU-02, QA-03, CU-03, CU-01, QA-01, R-03)', async () => {
    const { baseUrl } = await startApi();

    // 1. Registro y login de ADMIN y CLIENTE (R-02 / QA-02)
    const regAdmin = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Admin CineStar',
        email: 'admin@cinestar.com',
        password: 'Password123',
        rol: 'ADMIN',
      }),
    });
    const adminCreated = await regAdmin.json();
    expect(regAdmin.status).toBe(201);
    expect(adminCreated.passwordHash).toBeUndefined();

    const loginAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cinestar.com', password: 'Password123' }),
    });
    const { token: adminToken } = await loginAdmin.json();
    expect(loginAdmin.status).toBe(200);

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Ana Pérez',
        email: 'ana@correo.com',
        password: 'Password123',
      }),
    });
    const loginCliente = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@correo.com', password: 'Password123' }),
    });
    const { token: clienteToken } = await loginCliente.json();

    // 2. Cliente sin rol ADMIN recibe 403 al crear película (QA-03)
    const forbiddenPelicula = await fetch(`${baseUrl}/api/peliculas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({
        titulo: 'Sin Permiso',
        sinopsis: 'Prueba',
        duracionMinutos: 100,
        clasificacion: 'PG',
        genero: 'Drama',
        estado: 'ESTRENO',
      }),
    });
    expect(forbiddenPelicula.status).toBe(403);

    // 3. ADMIN crea película y función; cruce de horario en la misma sala responde 409 (CU-02)
    const createPelicula = await fetch(`${baseUrl}/api/peliculas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        titulo: 'Interestelar',
        sinopsis: 'Exploración espacial.',
        duracionMinutos: 160,
        clasificacion: 'PG-13',
        genero: 'Ciencia Ficción',
        estado: 'ESTRENO',
      }),
    });
    const pelicula = await createPelicula.json();
    expect(createPelicula.status).toBe(201);

    const createFuncion = await fetch(`${baseUrl}/api/funciones`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        peliculaId: pelicula.id,
        sala: 'Sala IMAX',
        horarioInicio: '2026-12-01T20:00:00Z',
        precioEntrada: 8.5,
        capacidadTotal: 50,
      }),
    });
    const funcion = await createFuncion.json();
    expect(createFuncion.status, JSON.stringify(funcion)).toBe(201);

    const cruceHorario = await fetch(`${baseUrl}/api/funciones`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        peliculaId: pelicula.id,
        sala: 'Sala IMAX',
        horarioInicio: '2026-12-01T21:00:00Z',
        precioEntrada: 8.5,
        capacidadTotal: 50,
      }),
    });
    expect(cruceHorario.status).toBe(409);

    // 4. Consulta pública de cartelera (CU-03)
    const listPeliculas = await fetch(`${baseUrl}/api/peliculas`);
    const cartelera = await listPeliculas.json();
    expect(listPeliculas.status).toBe(200);
    expect(cartelera).toHaveLength(1);

    // 5. Reserva sin token responde 401 (R-02)
    const anonReserva = await fetch(`${baseUrl}/api/reservas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ funcionId: funcion.id, asientos: ['B1'] }),
    });
    expect(anonReserva.status).toBe(401);

    // 6. Bloqueo temporal de asientos, rechazo por asiento duplicado (409) y confirmación (CU-01 / QA-01)
    const crearReserva = await fetch(`${baseUrl}/api/reservas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({ funcionId: funcion.id, asientos: ['B1', 'B2'] }),
    });
    const reserva = await crearReserva.json();
    expect(crearReserva.status).toBe(201);
    expect(reserva.estado).toBe('BLOQUEADA');

    const asientoDuplicado = await fetch(`${baseUrl}/api/reservas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({ funcionId: funcion.id, asientos: ['B2'] }),
    });
    expect(asientoDuplicado.status).toBe(409);

    const confirmarReserva = await fetch(`${baseUrl}/api/reservas/${reserva.id}/confirmar`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${clienteToken}` },
    });
    const reservaConfirmada = await confirmarReserva.json();
    expect(confirmarReserva.status).toBe(200);
    expect(reservaConfirmada.estado).toBe('CONFIRMADA');

    // 7. Regla R-03: No permite cancelar reserva ya pagada/confirmada (409), pero sí una BLOQUEADA (200)
    const cancelarConfirmada = await fetch(`${baseUrl}/api/reservas/${reserva.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${clienteToken}` },
    });
    expect(cancelarConfirmada.status).toBe(409);

    const reservaPendiente = await fetch(`${baseUrl}/api/reservas`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({ funcionId: funcion.id, asientos: ['C1'] }),
    });
    const pendiente = await reservaPendiente.json();

    const cancelarPendiente = await fetch(`${baseUrl}/api/reservas/${pendiente.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${clienteToken}` },
    });
    expect(cancelarPendiente.status).toBe(200);
  });

  it('publica el documento OpenAPI como YAML accesible', async () => {
    const { baseUrl } = await startApi();
    const response = await fetch(`${baseUrl}/openapi.yaml`);
    const document = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/yaml');
    expect(document).toContain('openapi: 3.0.3');
    expect(document).toContain('/api/reservas:');
    expect(document).toContain("'201':");
    expect(document).toContain("'400':");
  });
});