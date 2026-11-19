const pool = require('../../db/pool');
const Reserva = require('../domain/entities/Reserva');
const ReservaRepository = require('../domain/repositories/ReservaRepository');

class PostgresReservaRepository extends ReservaRepository {
  _mapearAEntidad(fila, asientos = []) {
    if (!fila) return null;

    const precioUnitario =
      asientos.length > 0
        ? Number((Number(fila.total) / asientos.length).toFixed(2))
        : 0;

    return new Reserva({
      id: fila.id,
      usuarioId: fila.usuario_id,
      funcionId: fila.funcion_id,
      asientos,
      precioUnitario,
      estado: fila.estado,
      expiraEn: fila.expira_en
    });
  }

  async guardar(reserva) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const queryReserva = `
        INSERT INTO reservas (usuario_id, funcion_id, total, estado, expira_en)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, usuario_id, funcion_id, total, estado, expira_en
      `;
      const valoresReserva = [
        reserva.usuarioId,
        reserva.funcionId,
        reserva.total,
        reserva.estado,
        reserva.expiraEn
      ];

      const resReserva = await client.query(queryReserva, valoresReserva);
      const filaReserva = resReserva.rows[0];

      const queryAsiento = `
        INSERT INTO reserva_asientos (reserva_id, asiento)
        VALUES ($1, $2)
      `;

      for (const asiento of reserva.asientos) {
        await client.query(queryAsiento, [filaReserva.id, asiento]);
      }

      await client.query('COMMIT');

      return this._mapearAEntidad(filaReserva, reserva.asientos);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async buscarPorId(id) {
    const query = `
      SELECT
        r.id,
        r.usuario_id,
        r.funcion_id,
        r.total,
        r.estado,
        r.expira_en,
        COALESCE(
          ARRAY_AGG(ra.asiento) FILTER (WHERE ra.asiento IS NOT NULL),
          '{}'
        ) AS asientos
      FROM reservas r
      LEFT JOIN reserva_asientos ra ON ra.reserva_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
    `;

    const resultado = await pool.query(query, [id]);
    const fila = resultado.rows[0];

    if (!fila) return null;

    return this._mapearAEntidad(fila, fila.asientos);
  }

  async actualizarEstado(id, nuevoEstado) {
    const query = `
      UPDATE reservas
      SET estado = $1
      WHERE id = $2
      RETURNING id
    `;

    const resultado = await pool.query(query, [nuevoEstado, id]);
    return resultado.rowCount > 0;
  }

  async listarPorUsuario(usuarioId) {
    const query = `
      SELECT
        r.id,
        r.usuario_id,
        r.funcion_id,
        r.total,
        r.estado,
        r.expira_en,
        COALESCE(
          ARRAY_AGG(ra.asiento) FILTER (WHERE ra.asiento IS NOT NULL),
          '{}'
        ) AS asientos
      FROM reservas r
      LEFT JOIN reserva_asientos ra ON ra.reserva_id = r.id
      WHERE r.usuario_id = $1
      GROUP BY r.id
      ORDER BY r.id DESC
    `;

    const resultado = await pool.query(query, [usuarioId]);
    return resultado.rows.map((fila) =>
      this._mapearAEntidad(fila, fila.asientos)
    );
  }
}

module.exports = PostgresReservaRepository;