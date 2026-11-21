import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "./errors.js";
import { it } from "node:test";

const BLOQUEO_MINUTOS = 5;

export class CreateReservaService {
  constructor(reservas, funciones, peliculas) {
    this.reservas = reservas;
    this.funciones = funciones;
    this.peliculas = peliculas;
  }

  async execute(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo debe ser un objeto JSON.");
    }

    const allowedFields = new Set(["usuarioId", "funcionId", "asientos"]);
    const unexpectedField = Object.keys(input).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new ValidationError(
        `El campo ${unexpectedField} no está permitido.`,
      );
    }

    const usuarioId = this.requiredText(input.usuarioId, "usuarioId");
    const funcionId = this.requiredText(input.funcionId, "funcionId");
    const asientos = this.validAsientos(input.asientos);

    const funcion = await this.funciones.findById(funcionId);
    if (!funcion) {
      throw new NotFoundError("La función especificada no existe.");
    }
    const pelicula = await this.peliculas.findById(funcion.peliculaId);
    if (!pelicula || pelicula.estado === "PREVENTA") {
      throw new ConflictError(
        "La película no está habilitada para emisión de boletos.",
      );
    }

    const todasReservas = await this.reservas.findAll();
    const ahora = new Date();

    const ocupadosSet = new Set(
      todasReservas
        .filter(
          (r) =>
            r.funcionId === funcionId &&
            (r.estado === "CONFIRMADA" ||
              (r.estado === "BLOQUEADA" && new Date(r.expiraEn) > ahora)),
        )
        .flatMap((r) => r.asientos),
    );

    const conflictos = asientos.filter((asiento) => ocupadosSet.has(asiento));
    if (conflictos.length > 0) {
      throw new ConflictError(
        `Los siguientes asientos ya fueron reservados o bloqueados: ${conflictos.join(", ")}.`,
      );
    }
    if (ocupadosSet.size + asientos.length > funcion.capacidadTotal) {
      throw new ConflictError(
        "La cantidad de asientos supera la capacidad disponible de la sala.",
      );
    }

    const total = Number((asientos.length * funcion.precioEntrada).toFixed(2));
    const createdAt = new Date();
    const expiraEn = new Date(
      createdAt.getTime() + BLOQUEO_MINUTOS * 60 * 1000,
    );

    return this.reservas.create({
      id: randomUUID(),
      usuarioId,
      funcionId,
      asientos,
      total,
      estado: "BLOQUEADA",
      expiraEn,
      createdAt,
    });
  }

  requiredText(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${field} es obligatorio y debe ser texto.`);
    }
    return value.trim();
  }
  
  validAsientos(value){
    if(!Array.isArray(value) || value.length === 0){
        throw new ValidationError('asientos debe ser una lista con al menos un asiento.');
    }
    const normalizados = value.map((item) => {
        if(typeof item !== 'string' || item.trim().length === 0 || item.trim().length > 10){
            throw new ValidationError('Cada asiento debe ser un código válido (ej. A1, B4).');
        }

        return item.trim().toUpperCase();
    });

    const unicos = [...new Set(normalizados)];
    if(unicos.length !== normalizados.length){
        throw new ValidationError('No se permiten asientos duplicados en la misma solicitud.');
    }
    return unicos
  }
}
