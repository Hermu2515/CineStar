const pool = require("../../db/pool");
const Usuario = require("../domain/entities/Usuario");
const UsuarioRepository = require("../domain/repositories/UsuarioRepository");

class PostgresUsuarioRepository extends UsuarioRepository {
  _mapearAEntidad(fila) {
    if (!fila) return null;
    return new Usuario({
      id: fila.id,
      nombre: fila.nombre,
      email: fila.email,
      passwordHash: fila.password_hash,
      rol: fila.rol,
    });
  }
  async buscarPorEmail(email) {
    const query = `
      SELECT id, nombre, email, password_hash, rol
      FROM usuarios
      WHERE email = $1
    `;
    const resultado = await pool.query(query, [email.toLowerCase().trim()]);
    return this._mapearAEntidad(resultado.rows[0]);
  }
  async buscarPorId(id) {
    const query = `
      SELECT id, nombre, email, password_hash, rol
      FROM usuarios
      WHERE id = $1
    `;
    const resultado = await pool.query(query, [id]);
    return this._mapearAEntidad(resultado.rows[0]);
  }

  async guardar(usuario) {
    const query = `
      INSERT INTO usuarios (nombre, email, password_hash, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, email, password_hash, rol
    `;
    const valores = [
        usuario.nombre,
        usuario.email,
        usuario.passwordHash,
        usuario.rol
    ];
    const resultado = await pool.query(query.valores);
    return this._mapearAEntidad(resultado.rows[0])
  }
}

module.exports = PostgresUsuarioRepository;