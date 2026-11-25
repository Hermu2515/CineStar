import { describe, expect, it, vi } from 'vitest';
import { PostgresReservaRepository } from '../src/persistence/PostgresReservaRepository.js';

describe('PostgresReservaRepository', () => {
  it('parametriza los valores SQL en transacción y mapea la fila al objeto Reserva', async () => {
    const createdAt = new Date('2026-11-20T18:00:00.000Z');
    const expiraEn = new Date('2026-11-20T18:05:00.000Z');
    const row = {
      id: '5e0057b7-932f-4fd3-83d6-01d43a95ebf8',
      usuario_id: 'user-1',
      funcion_id: 'fun-1',
      total: '17.00',
      estado: 'BLOQUEADA',
      expira_en: expiraEn,
      created_at: createdAt,
    };
   
    const clientQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [row] }) // INSERT reservas
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
      id: row.id,
      usuarioId: row.usuario_id,
      funcionId: row.funcion_id,
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
      [row.id, row.usuario_id, row.funcion_id, 17, 'BLOQUEADA', expiraEn, createdAt],
    );
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reserva_asientos'),
      [row.id, 'A1'],
    );
    expect(clientQuery).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
    expect(result).toEqual(reserva);
  });
});