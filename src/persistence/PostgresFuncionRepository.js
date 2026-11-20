export class PostgresFuncionRepository{
    constructor(pool){
        this.pool = pool
    }
    async created(funcion){
        const result = await this.pool.query(
            `INSERT INTO funciones(id, pelicula_id, sala, horario_inicio, horario_fin, precio_entrada, capacidad_total, created_at)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, pelicula_id, sala, horario_inicio, horario_fin, precio_entrada, capacidad_total, created_at`,
            [
                funcion.id,
                funcion.peliculaId,
                funcion.sala,
                funcion.horarioInicio,
                funcion.horarioFin,
                funcion.precioEntrada,
                funcion.capacidadTotal,
                funcion.createdAt,
            ],
        );
        return this.toFuncion(result.rows[0])
    }

    async findAll(){
        const result = await this.pool.query(
            `Select id, pelicula_id, sala, horario_inicio, horario_fin, precio_entrada, capacidad_total, created_at
            FROM funciones
            ORDER BY horario_inicio ASC, id ASC`,
        );
        return result.rows.map((row) => this.toFuncion(row));
    }

    async findById(id){
        const result = await this.pool.query(
            `
            SELECT id, pelicula_id, sala, horario_inicio, horario_fin, precio_entrada, capacidad_total, created_at
            FROM funciones
            WHERE id = $1`,
            [id],
        );

        if(result.rows.length === 0){
            return null;
        }
        return this.toFuncion(result.rows[0]);
    }

    toFuncion(row){
        return {
            id: row.id,
            peliculaId: row.pelicula_id,
            sala: row.sala,
            horarioInicio: row.horario_inicio,
            horarioFin: row.horario_fin,
            precioEntrada: Number(row.precio_entrada),
            capacidadTotal: Number(row.capcidad_total),
            createdAt: row.created_at,
            
        };
    }
}