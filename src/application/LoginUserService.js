import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ValidationError } from "./errors.js";

export class LoginUserService {
  constructor(usuarios, jwtSecret) {
    this.usuarios = usuarios;
    this.jwtSecret = jwtSecret;
  }

  async execute(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo debe ser un objeto JSON.");
    }

    const allowedFields = new Set(["email", "password"]);
    const unexpectedField = Object.keys(input).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new ValidationError(
        `El campo ${unexpectedField} no está permitido.`,
      );
    }

    if (typeof input.email !== "string" || input.email.trim().length === 0) {
      throw new ValidationError("email es obligatorio.");
    }
    if (typeof input.password !== "string" || input.password.length === 0) {
      throw new ValidationError("password es obligatorio.");
    }
    const email = input.email.trim().toLowerCase();
    const usuario = await this.usuarios.findByEmail(email);

    if (!usuario) {
      throw new UnauthorizedError("Credenciales inválidas.");
    }

    const passwordValid = await bcrypt.compare(
      input.password,
      usuario.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedError("Credenciales inválidas.");
    }

    const token = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
      this.jwtSecret,
      { expiresIn: "2h" },
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}
