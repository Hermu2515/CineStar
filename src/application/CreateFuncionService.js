import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "./errors.js";

export class CreateFuncionService {
  constructor(funciones, peliculas) {
    this.funciones = funciones;
    this.peliculas = peliculas;
  }

  async execute(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo debe ser un objeto JSON.");
    }
    const allowedFields = new Set([
      "peliculaId",
      "sala",
      "horarioInicio",
      "precioEntrada",
      "capacidadTotal",
    ]);
    const unexpectedField = Object.keys(input).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new ValidationError(
        `El campo ${unexpectedField} no está permitido.`,
      );
    }

    const peliculaId = this.requiredText(input.peliculaId, "peliculaId");
    const sala = this.requiredText(input.sala, "sala");
    const horarioInicio = this.validDate(input.horarioInicio, "horarioInicio");
    const precioEntrada = this.validPositiveNumber(
      input.precioEntrada,
      "precioEntrada",
    );
    const capacidadTotal = this.validPositiveInteger(
      input.capacidadTotal,
      "capacidadTotal",
    );

    const pelicula = await this.peliculas.findById(peliculaId);
    if (!pelicula) {
      throw new NotFoundError("La película especificada no existe.");
    }

    if (pelicula.estado === "PREVENTA") {
      throw new ConflictError(
        "No se pueden registrar funciones para una película en estado PREVENTA.",
      );
    }

    const horarioFin = new Date(
      horarioInicio.getTime() + pelicula.duracionMinutos * 60 * 1000,
    );
    const existentes = await this.funciones.findAll();
    const hayCruce = existentes.some(
      (f) =>
        f.sala.toLowerCase() === sala.toLowerCase() &&
        new Date(f.horarioInicio) < horarioFin &&
        new Date(f.horarioFin) > horarioInicio,
    );
    if (hayCruce) {
      throw new ConflictError(`Existe un cruce de horario en la sala ${sala}.`);
    }

    return this.funciones.create({
      id: randomUUID(),
      peliculaId,
      sala,
      horarioInicio,
      horarioFin,
      precioEntrada,
      capacidadTotal,
      createdAt: new Date(),
    });
  }
  requiredText(value, field) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new ValidationError(`${field} es obligatorio y debe ser texto.`);
    }

    const normalized = value.trim();
    if (normalized.length > 60) {
      throw new ValidationError(`${field} no puede superar 60 caracteres.`);
    }
    return normalized;
  }

  validDate(value, field){
    const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if(typeof value !== 'string' || isoDateTime.test(value)){
        throw new ValidationError(`${field} debe ser una fecha ISO válida.`)
    }
    const parsed = new Date(value);
    if(Number.isNaN(parsed.getTime())){
        throw new ValidationError(`${field} debe ser una fecha ISO válida`)
    }
    return parsed;
  }

  validPositiveNumber(value, field) {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      throw new ValidationError(`${field} debe ser un número mayor a 0.`);
    }
    return Number(value.toFixed(2));
  }

  validPositiveInteger(value, field) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`${field} debe ser un entero mayor a 0.`);
    }
    return value;
  }
}
