import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors.js";

export class ConfirmReservasService {
  constructor(reservas) {
    this.reservas = reservas;
  }

  async execute(input) {
    if (
      !input ||
      typeof input.reservaId !== "string" ||
      input.reservaId.trim().length === 0
    ) {
      throw new ValidationError("reservaId es obligatorio.");
    }
    if (!input.usuarioId || typeof input.usuarioId !== "string") {
      throw new ValidationError("usuarioId es obligatorio.");
    }

    const reserva = await this.reservas.findById(input.reservaId.trim());
    if (!reserva) {
      throw new NotFoundError("La reserva especificada no existe.");
    }

    if (reserva.usuarioId !== input.usuarioId) {
      throw new ForbiddenError(
        "No tienes permiso para confirmar esta reserva.",
      );
    }

    if (reserva.estado === "CONFIRMADA") {
      throw new ConflictError("La reserva ya se encuentra confirmada.");
    }

    if (new Date(reserva.expiraEn) <= new Date()) {
      throw new ConflictError(
        "El bloqueo temporal de los asientos expiró. Selecciona tus asientos nuevamente.",
      );
    }

    return this.reservas.confirm(reserva.id);
  }
}
