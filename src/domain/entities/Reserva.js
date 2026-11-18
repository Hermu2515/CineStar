class Reserva {
  constructor({
    id = null,
    usuarioId,
    funcionId,
    asientos,
    precioUnitario,
    estado = "BLOQUEADA",
    expiraEn = null,
  }) {
    if (!usuarioId) {
      throw new Error("La reserva debe estar asociada a un usuario válido");
    }
    if (!funcionId) {
      throw new Error("La reserva debe estar asociada a una función válida.");
    }
    if (!Array.isArray(asientos) || asientos.length === 0) {
      throw new Error(
        "Debe seleccionar al menos un asiento para realizar la reserva.",
      );
    }
    if (asientos.length > 10) {
      throw new Error(
        "No se pueden reservar más de 10 asientos en una misma transacción.",
      );
    }

    const asientosNormalizados = asientos.map((a) =>
      String(a).toUpperCase().trim(),
    );
    const asientosUnicos = new Set(asientosNormalizados);

    if (asientosUnicos.size !== asientosNormalizados.length) {
      throw new Error("La selección contiene asientos duplicados.");
    }
    const estadosPermitidos = [
      "BLOQUEADA",
      "CONFIRMADA",
      "EXPIRADA",
      "CANCELADA",
    ];
    if (!estadosPermitidos.includes(estado)) {
      throw new Error(`Estado de reserva no válido: ${estado}`);
    }
    this.id = id;

    this.usuarioId = usuarioId;
    this.funcionId = funcionId;
    this.asientos = Array.from(asientosUnicos);
    this.total = this.calcularTotal(precioUnitario);
    this.estado = estado;
    this.expiraEn = expiraEn
      ? new Date(expiraEn)
      : this.generarTiempoExpiracion(5);
  }

  calcularTotal(precioUnitario) {
    const precio = Number(precioUnitario);
    if (Number.isNaN(precio) || precio <= 0) {
      throw new Error(
        "El precio unitario debe ser mayor a cero para calcular el total.",
      );
    }
    return Number((this.asientos.length * precio).toFixed(2));
  }
  generarTiempoExpiracion(minutos) {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutos);
    return fecha;
  }

  haExpirado() {
    return this.estado === "BLOQUEADA" && new Date() > this.expiraEn;
  }
  confirmarPago() {
    if (this.estado === "Confirmada") {
      throw new Error("Esta reserva ya fue confirmada previamente.");
    }
    if (this.estado === "CANCELADA") {
      throw new Error("No se puede confirmar una reserva cancelada.");
    }
    if (this.haExpirado()) {
      this.estado = "EXPIRADA";
      throw new Error(
        "El tiempo de bloqueo temporal de los asientos ha expirado.",
      );
    }
    this.estado = 'CONFIRMADA';
  }
}
module.exports = Reserva;