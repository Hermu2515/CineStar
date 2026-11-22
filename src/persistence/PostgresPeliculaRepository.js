export class PostgresPeliculaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(pelicula) {
    const result = await this.pool.query(
      `INSERT INTO peliculas(id, titulo, sinopsis, duracion_minutos, clasificacion, genero, estado, poster_url, created_at)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, titulo, sinopsis, duracion_minutos, clasificacion, genero, estado, poster_url, created_at`,
      [
        pelicula.id,
        pelicula.titulo,
        pelicula.sinopsis,
        pelicula.duracionMinutos,
        pelicula.clasificacion,
        pelicula.genero,
        pelicula.estado,
        pelicula.posterUrl ?? null,
        pelicula.createdAt,
    ],
    );
    return this.toPelicula(result.rows[0]);
  }

  async findAll(filters = {}){
    const result = await this.pool.query(
        `SELECT id, titulo, sinopsis, duracion_minutos, clasificacion, genero, estado, poster_url, created_at
        FROM peliculas 
        ORDER BY created_at DESC, id ASC`,
    );
    return result.rows.map((row) => this.toPelicula(row))
  }

  async findById(id){
    const result = await this.pool.query(
        `SELECT id, titulo, sinopsis, duracion_minutos, clasificacion, genero, estado, poster_url, created_at
        FROM peliculas
        WHERE id = $1`,
        [id],
    );
    if(result.rows.length === 0){
        return null;
    }
    return this.toPelicula(result.rows[0])
  }

  toPelicula(row){
    return {
        id: row.id,
        titulo: row.titulo,
        sinopsis: row.sinopsis,
        duracionMinutos: Number(row.duracion_minutos),
        clasificacion: row.clasificacion,
        genero: row.genero,
        estado: row.estado,
        posterUrl: row.poster_url,
        createdAt: row.created_at,
    };
  }
}
