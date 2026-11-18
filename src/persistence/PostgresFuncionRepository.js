const pool = require("../../db/pool");
const Funcion = require("../domain/entities/Funcion");
const FuncionRepository = require("../domain/repositories/FuncionRepository");

class PostgresFuncionRepository extends FuncionRepository {
  _mapearAEntidad(fila, asientosOcupados = []) {
    if (!fila) return null;

    return new Funcion({
      id: fila.id,
      pelicula: fila.pelicula,
      sala: fila.sala,
      horario: fila.horario,
      precioEntrada: Number(fila.precio_entrada),
      capacidadTotal: Number(fila.capacidad_total),
      asientosOcupados,
    });
  }
  async listarTodas() {
    const query = `
      SELECT
        f.id,
        f.pelicula,
        f.sala,
        f.horario,
        f.precio_entrada,
        f.capacidad_total,
        COALESCE(
          ARRAY_AGG(ra.asiento) FILTER (WHERE ra.asiento IS NOT NULL),
          '{}'
        ) AS asientos_ocupados
      FROM funciones f
      LEFT JOIN reservas r
        ON r.funcion_id = f.id
        AND (r.estado = 'CONFIRMADA' OR (r.estado = 'BLOQUEADA' AND r.expira_en > NOW()))
      LEFT JOIN reserva_asientos ra
        ON ra.reserva_id = r.id
      GROUP BY f.id
      ORDER BY f.horario ASC
    `;

    const resultado = await pool.query(query);
    return resultado.rows.map((fila) =>
      this._mapearAEntidad(fila, fila.asientosOcupados),
    );
  }

  async buscarPorId(id) {
    const queryFuncion = `
      SELECT id, pelicula, sala, horario, precio_entrada, capacidad_total
      FROM funciones
      WHERE id = $1
    `;
    const resFuncion = await pool.query(queryFuncion, [id]);
    const fila = resFuncion.rows[0];

    if (!fila) return null;
    const queryAsientos = `
      SELECT ra.asiento
      FROM reserva_asientos ra
      INNER JOIN reservas r ON ra.reserva_id = r.id
      WHERE r.funcion_id = $1
        AND (r.estado = 'CONFIRMADA' OR (r.estado = 'BLOQUEADA' AND r.expira_en > NOW()))
    `;

    const resAsientos = await pool.query(queryAsientos, [id]);
    const asientosOcupados = resAsientos.rows.map((row) => row.asiento);
    return this._mapearAEntidad(fila, asientosOcupados);
  }

  async guardar(funcion){
    const query = `
      INSERT INTO funciones (pelicula, sala, horario, precio_entrada, capacidad_total)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, pelicula, sala, horario, precio_entrada, capacidad_total
    `;
    const valores = [
      funcion.pelicula,
      funcion.sala,
      funcion.horario,
      funcion.precioEntrada,
      funcion.capacidadTotal
    ];

    const resultado = await pool.query(query, valores);
    return this._mapearAEntidad(
        resultado.rows[0],
        Array.from(funcion.asientosOcupados)
    );
  }
}
module.exports = PostgresFuncionRepository;