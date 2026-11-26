import { describe, expect, it, vi } from 'vitest';
import { PostgresReservaRepository } from '../src/persistence/PostgresReservaRepository.js';

describe('PostgresReservaRepository', () => {
  const createdAt = new Date('2026-11-20T18:00:00.000Z');
  const expiraEn = new Date('2026-11-20T18:05:00.000Z');

  const baseRow = {
    id: '5e0057b7-932f-4fd3-83d6-01d43a95ebf8',
    usuario_id: 'user-1',
    funcion_id: 'fun-1',
    total: '17.00',
    estado: 'BLOQUEADA',
    expira_en: expiraEn,
    created_at: createdAt,
  };

  //Simulación de los querys del usuario y lo que regresa
  it('parametriza los valores SQL en transacción y mapea la fila al objeto Reserva', async () => {
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [baseRow] }) // INSERT reservas
      //Regresa una fila por el RETURING
      .mockResolvedValueOnce({ rows: [] }) // INSERT reserva_asientos A1
      .mockResolvedValueOnce({ rows: [] }) // INSERT reserva_asientos A2
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const release = vi.fn();
    const pool = {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue({ query: clientQuery, release }),
    };

    const repository = new PostgresReservaRepository(pool);
    const reserva = {
      id: baseRow.id,
      usuarioId: baseRow.usuario_id,
      funcionId: baseRow.funcion_id,
      asientos: ['A1', 'A2'],
      total: 17,
      estado: 'BLOQUEADA',
      expiraEn,
      createdAt,
    };

    const result = await repository.create(reserva);

    expect(clientQuery).toHaveBeenCalledWith('BEGIN');
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining('VALUES ($1, $2, $3, $4, $5, $6, $7)'),
      [baseRow.id, baseRow.usuario_id, baseRow.funcion_id, 17, 'BLOQUEADA', expiraEn, createdAt],
    );
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reserva_asientos'),
      [baseRow.id, 'A1'],
    );
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reserva_asientos'),
      [baseRow.id, 'A2'],
    );
    expect(clientQuery).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
    expect(result).toEqual(reserva);
  });

  it('ejecuta ROLLBACK y libera la conexión si falla alguna consulta en la transacción', async () => {
    const dbError = new Error('Asiento duplicado en la función');
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [baseRow] }) // INSERT reservas
      .mockRejectedValueOnce(dbError) // Falla al insertar asiento
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    const release = vi.fn();
    const pool = {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue({ query: clientQuery, release }),
    };

    const repository = new PostgresReservaRepository(pool);
    const reserva = {
      id: baseRow.id,
      usuarioId: baseRow.usuario_id,
      funcionId: baseRow.funcion_id,
      asientos: ['A1'],
      total: 17,
      estado: 'BLOQUEADA',
      expiraEn,
      createdAt,
    };

    await expect(repository.create(reserva)).rejects.toThrow('Asiento duplicado en la función');
    expect(clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('findById retorna la reserva mapeada cuando existe y null cuando no', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ ...baseRow, asientos: ['A1', 'A2'] }] })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const repository = new PostgresReservaRepository(pool);

    const encontrada = await repository.findById(baseRow.id);
    expect(encontrada).toEqual({
      id: baseRow.id,
      usuarioId: 'user-1',
      funcionId: 'fun-1',
      asientos: ['A1', 'A2'],
      total: 17,
      estado: 'BLOQUEADA',
      expiraEn,
      createdAt,
    });

    const noEncontrada = await repository.findById('id-inexistente');
    expect(noEncontrada).toBeNull();
  });

  it('findByUsuarioId y findAll mapean las filas devueltas', async () => {
    const rowConAsientos = { ...baseRow, asientos: ['B1'] };
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [rowConAsientos] })
        .mockResolvedValueOnce({ rows: [rowConAsientos] }),
    };

    const repository = new PostgresReservaRepository(pool);

    const porUsuario = await repository.findByUsuarioId('user-1');
    expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE r.usuario_id = $1'), ['user-1']);
    expect(porUsuario).toHaveLength(1);
    expect(porUsuario[0].asientos).toEqual(['B1']);

    const todas = await repository.findAll();
    expect(todas).toHaveLength(1);
    expect(todas[0].total).toBe(17);
  });

  it('confirm actualiza el estado a CONFIRMADA o retorna null si el id no existe', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: baseRow.id }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ ...baseRow, estado: 'CONFIRMADA', asientos: ['A1'] }] }) // findById interno
        .mockResolvedValueOnce({ rows: [] }), // UPDATE sin coincidencias
    };

    const repository = new PostgresReservaRepository(pool);

    const confirmada = await repository.confirm(baseRow.id);
    expect(confirmada.estado).toBe('CONFIRMADA');

    const inexistente = await repository.confirm('id-inexistente');
    expect(inexistente).toBeNull();
  });

  it('deleteById retorna true si eliminó la reserva y false si no existía', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: baseRow.id }] })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const repository = new PostgresReservaRepository(pool);

    await expect(repository.deleteById(baseRow.id)).resolves.toBe(true);
    await expect(repository.deleteById('id-inexistente')).resolves.toBe(false);
  });
});