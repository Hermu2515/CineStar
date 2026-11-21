export class ReservaController {
  constructor(
    createReservaService,
    confirmReservaService,
    cancelReservaService,
    listMisReservasService,
  ) {
    this.createReservaService = createReservaService;
    this.confirmReservaService = confirmReservaService;
    this.cancelReservaService = cancelReservaService;
    this.listMisReservasService = listMisReservasService;
  }
  create = async(req, res, next) =>{
    try {
        const reserva = await this.createReservaService.execute({...req.body, usuarioId: req.user.sub})
        return res.status(201).json(reserva);
    }catch(error){
        return next(error);
    }
  }

  confirm = async (req, res, next) => {
    try {
      const reserva = await this.confirmReservaService.execute({
        reservaId: req.params.id,
        usuarioId: req.user.sub,
      });
      return res.status(200).json(reserva);
    } catch (error) {
      return next(error);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const result = await this.cancelReservaService.execute({
        reservaId: req.params.id,
        usuarioId: req.user.sub,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listMias = async (req, res, next) => {
    try {
      const reservas = await this.listMisReservasService.execute(req.user.sub);
      return res.status(200).json(reservas);
    } catch (error) {
      return next(error);
    }
  };
}