export class ListMisReservasService {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async execute(usuarioId) {
    return this.reservaRepository.findByUsuarioId(usuarioId);
  }
}