import { ConflictError, ForbiddenError, NotFoundError } from './errors.js';

export class CancelReservaService {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async execute({ reservaId, usuarioId }) {
    const reserva = await this.reservaRepository.findById(reservaId);
    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada.');
    }

    if (reserva.usuarioId !== usuarioId) {
      throw new ForbiddenError('No tienes permiso para cancelar esta reserva.');
    }

    if (reserva.estado === 'CONFIRMADA') {
      throw new ConflictError(
        'Regla R-03: No se permite cancelar una reserva que ya fue pagada y confirmada.',
      );
    }

    await this.reservaRepository.deleteById(reservaId);
    return {
      id: reservaId,
      cancelada: true,
      message: 'Bloqueo temporal cancelado y asientos liberados.',
    };
  }
}