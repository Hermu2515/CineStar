export class PostgresReservaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(reserva) {
    const cliente = await this.pool.connect();
    try {
      await cliente.query("BEGIN");
      const result = await cliente.query(
        `INSERT INTO reservas (id, usuario_id, funcion_id, total, estado, expira_en, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, usuario_id, funcion_id, total, estado, expira_en, created_at`,
        [
          reserva.id,
          reserva.usuarioId,
          reserva.funcionId,
          reserva.total,
          reserva.estado,
          reserva.expiraEn,
          reserva.createdAt,
        ],
      );

      for (const asiento of reserva.asientos) {
        await cliente.query(
          `INSERT INTO reserva_asientos(reserva_id, asiento)
            VALUES($1, $2)`,
          [reserva.id, asiento],
        );
      }
      await cliente.query("COMMIT");
      return this.ToReserva({ ...result.rows[0], asientos: reserva.asientos });
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  }

  async findAll() {
    const result = await this.pool.query(
      `SELECT r.id, r.usuario_id, r.funcion_id, r.total, r.estado, r.expira_en, r.created_at,
              COALESCE(ARRAY_AGG(ra.asiento ORDER BY ra.asiento) FILTER (WHERE ra.asiento IS NOT NULL), '{}') AS asientos
       FROM reservas r
       LEFT JOIN reserva_asientos ra ON ra.reserva_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC, r.id ASC`,
    );
    return result.rows.map((row) => toReserva(row));
  }

  async findById(id) {
    const result = await this.pool.query(
      `SELECT r.id, r.usuario_id, r.funcion_id, r.total, r.estado, r.expira_en, r.created_at,
              COALESCE(ARRAY_AGG(ra.asiento ORDER BY ra.asiento) FILTER (WHERE ra.asiento IS NOT NULL), '{}') AS asientos
       FROM reservas r
       LEFT JOIN reserva_asientos ra ON ra.reserva_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.toReserva(result.rows[0]);
  }

  async confirm(id){
    const result = this.pool.query(
        `UPDATE reservas SET estado = 'CONFIRMADA'
        WHERE id = $1
        RETURNING id`,
        [id],
    );

    if (result.rows.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  toReserva(row) {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      funcionId: row.funcion_id,
      asientos: row.asientos ?? [],
      total: Number(row.total),
      estado: row.estado,
      expiraEn: row.expira_en,
      createdAt: row.created_at,
    };
  }
}
