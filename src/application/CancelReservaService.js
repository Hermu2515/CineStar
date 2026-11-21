import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from './errors.js';

export class CancelReservaService {
  constructor(reservas) {
    this.reservas = reservas;
  }

  async execute(input) {
    if (!input || typeof input.reservaId !== 'string' || input.reservaId.trim().length === 0) {
      throw new ValidationError('reservaId es obligatorio.');
    }
    if (!input.usuarioId || typeof input.usuarioId !== 'string') {
      throw new ValidationError('usuarioId es obligatorio.');
    }

    const reserva = await this.reservas.findById(input.reservaId.trim());
    if (!reserva) {
      throw new NotFoundError('La reserva especificada no existe.');
    }

    if (reserva.usuarioId !== input.usuarioId) {
      throw new ForbiddenError('No tienes permiso sobre esta reserva.');
    }

    if (reserva.estado === 'CONFIRMADA') {
      throw new ConflictError(
        'Regla R-03: No se permite cancelar una reserva que ya fue pagada y confirmada.',
      );
    }

    await this.reservas.deleteById(reserva.id);

    return {
      id: reserva.id,
      cancelada: true,
      message: 'Bloqueo temporal cancelado y asientos liberados.',
    };
  }
}