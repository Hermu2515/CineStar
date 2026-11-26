export class PostgresUsuarioRepository {
  constructor(pool) {
    this.pool = pool;
  }
  async create(usuario) {
    const result = await this.pool.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, created_at)
            VALUES($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre, email, rol, created_at
            `,
      [
        usuario.id,
        usuario.nombre,
        usuario.email,
        usuario.passwordHash,
        usuario.rol,
        usuario.createdAt,
      ],
    );
    return this.toUsuario(result.rows[0]);
  }

  async findAll() {
    const result = await this.pool.query(
      `SELECT id, nombre, email, rol, created_at
     FROM usuarios
     ORDER BY created_at DESC, id ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      createdAt: row.created_at,
    }));
  }

  async findByEmail(email) {
    const result = await this.pool.query(
      `SELECT id, nombre, email, password_hash, rol, created_at
            FROM usuarios
            WHERE email = $1`,
      [email],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.toUsuarioWithPassword(result.rows[0]);
  }

  async findById(id) {
    const result = await this.pool.query(
      `SELECT id, nombre, email, rol, created_at
            FROM usuarios
            WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.toUsuario(result.rows[0]);
  }

  toUsuario(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      createdAt: row.created_at,
    };
  }

  toUsuarioWithPassword(row) {
    return {
      ...this.toUsuario(row),
      passwordHash: row.password_hash,
    };
  }
}
