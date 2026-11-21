import { randomUUID } from "node:crypto";
import { ValidationError } from "./errors.js";

const ESTADOS_VALIDOS = new Set(["ESTRENO", "PRE_ESTRENO", "PREVENTA"]);

export class CreatePeliculaService {
  constructor(peliculas) {
    this.peliculas = peliculas;
  }

  async execute(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo debe ser un objeto JSON.");
    }
    const allowedFields = new Set([
      "titulo",
      "sinopsis",
      "duracionMinutos",
      "clasificacion",
      "genero",
      "estado",
      "posterUrl",
    ]);
    const unexpectedField = Object.keys(input).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new ValidationError(
        `El campo ${unexpectedField} no está permitido.`,
      );
    }

    const titulo = this.requiredText(input.titulo, "titulo", 160);
    const sinopsis = this.requiredText(input.sinopsis, "sinopsis", 1000);
    const duracionMinutos = this.validDuration(input.duracionMinutos);
    const clasificacion = this.requiredText(
      input.clasificacion,
      "clasificacion",
      20,
    );
    const genero = this.requiredText(input.genero, "genero", 60);
    const estado = this.validEstado(input.estado);
    const posterUrl = this.validPosterUrl(input.posterUrl);
    return this.peliculas.create({
      id: randomUUID(),
      titulo,
      sinopsis,
      duracionMinutos,
      clasificacion,
      genero,
      estado,
      posterUrl,
      createdAt: new Date(),
    });
  }
  requiredText(value, field, maxLength) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${field} es obligatorio y debe ser texto.`);
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      throw new ValidationError(`${field} no puede superar ${maxLength} caracteres.`);
    }
    return normalized;
  }

  validDuration(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new ValidationError('duracionMinutos debe ser un número entero mayor a 0.');
    }
    return value;
  }

  validEstado(value) {
    if (typeof value !== 'string' || !ESTADOS_VALIDOS.has(value)) {
      throw new ValidationError('estado debe ser ESTRENO, PRE_ESTRENO o PREVENTA.');
    }
    return value;
  }

  validPosterUrl(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError('posterUrl debe ser una URL válida en texto.');
    }
    return value.trim();
  }
}
