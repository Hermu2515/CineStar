export class ListPeliculaService{
    constructor(peliculas){
        this.peliculas = peliculas
    }
    
    async execute(filters = {}){
        const todas = await this.peliculas.findAll()
        return todas.filters((pelicula) =>{
            if(
                filters.genero && pelicula.genero.toLowerCase() !== String(filters.genero).trim().toLowerCase()
            ){
                return false;
            }
            if(filters.estado && pelicula.estado !== String(filters.estado).trim()){
                return false;
            }
            return true;
        })
    }
}