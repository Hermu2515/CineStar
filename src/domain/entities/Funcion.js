class Funcion {
  constructor({
    id = null,
    pelicula,
    sala,
    horario,
    precioEntrada,
    capacidadTotal = 40,
    asientosOcupados = []
  }) {
    if (!pelicula || pelicula.trim().length === 0) {
      throw new Error('La función debe tener el nombre de una película.');
    }

    if (!sala || String(sala).trim().length === 0) {
      throw new Error('La función debe tener una sala asignada.');
    }

    if (!horario) {
      throw new Error('La función debe tener una fecha y hora programada.');
    }

    const precio = Number(precioEntrada);
    if (Number.isNaN(precio) || precio <= 0) {
      throw new Error('El precio de la entrada debe ser un número mayor a cero.');
    }

    const capacidad = Number(capacidadTotal);
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      throw new Error('La capacidad de la sala debe ser un número entero positivo.');
    }

    if (asientosOcupados.length > capacidad) {
      throw new Error('Los asientos ocupados no pueden superar la capacidad total de la sala.');
    }

    this.id = id;
    this.pelicula = pelicula.trim();
    this.sala = String(sala).trim();
    this.horario = new Date(horario);
    this.precioEntrada = precio;
    this.capacidadTotal = capacidad;
    this.asientosOcupados = new Set(asientosOcupados.map((a) => a.toUpperCase().trim()));
  }

  verificarDisponibilidad(asientosSolicitados) {
    if (!Array.isArray(asientosSolicitados) || asientosSolicitados.length === 0) {
      return { disponible: false, motivo: 'Debe seleccionar al menos un asiento.' };
    }

    if (this.asientosOcupados.size + asientosSolicitados.length > this.capacidadTotal) {
      return { disponible: false, motivo: 'No hay suficientes asientos disponibles en la sala.' };
    }

    for (const asiento of asientosSolicitados) {
      const codigoAsiento = String(asiento).toUpperCase().trim();
      if (this.asientosOcupados.has(codigoAsiento)) {
        return {
          disponible: false,
          motivo: `El asiento ${codigoAsiento} ya se encuentra ocupado.`
        };
      }
    }

    return { disponible: true };
  }

  obtenerAsientosDisponiblesCount() {
    return this.capacidadTotal - this.asientosOcupados.size;
  }
}

module.exports = Funcion;