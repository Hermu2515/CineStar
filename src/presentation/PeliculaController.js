export class PeliculaController {
  constructor(createPeliculaService, listPeliculasService) {
    this.createPeliculaService = createPeliculaService;
    this.listPeliculasService = listPeliculasService;
  }

  create = async (req, res, next) => {
    try {
      const pelicula = await this.createPeliculaService.execute(req.body);
      return res.status(201).json(pelicula);
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const peliculas = await this.listPeliculasService.execute({
        genero: req.query.genero,
        estado: req.query.estado,
      });
      return res.status(200).json(peliculas);
    } catch (error) {
      return next(error);
    }
  };
}