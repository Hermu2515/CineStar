export class FuncionController {
  constructor(createFuncionService, listFuncionesService) {
    this.createFuncionService = createFuncionService;
    this.listFuncionesService = listFuncionesService;
  }

  create = async (req, res, next) => {
    try {
      const funcion = await this.createFuncionService.execute(req.body);
      return res.status(201).json(funcion);
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const funciones = await this.listFuncionesService.execute({
        peliculaId: req.query.peliculaId,
        fecha: req.query.fecha,
      });
      return res.status(200).json(funciones);
    } catch (error) {
      return next(error);
    }
  };
}