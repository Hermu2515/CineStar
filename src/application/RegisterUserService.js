import {randomUUID} from 'node:crypto';
import bcrypt from 'bcrypt';
import { ConflicError, ValidationError } from './error';
import { normalize } from 'node:path';

export class RegisterUserService{
    constructor(usuarios){
        this.usuarios = usuarios;
    }

    async execute(input){
        if(typeof input !== 'object' || input === null || Array.isArray(input)){
            throw new ValidationError('El cuerpo debe ser un objeto JSON');
        }

        const allowedFields = new Set(['nombre', 'email', 'password', 'rol']);
        const unexpectedField = Object.keys(input).find((field)=> !allowedFields.has(field));
        if (unexpectedField){
            throw new ValidationError(`El campo ${unexpectedField} no está permitido`);
        }

        const nombre = this.requiredText(input.nombre, 'nombre');
        const email = this.validEmail(input.email);
        const password = this.validPassword(input.password);
        const rol = this.validRol(input.rol);
        const existing = await this.usuarios.findByEmail(email);
        if(existing){
            throw new ConflicError('El corre ya se encuentra registrado')
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return this.usuarios.create({
            id: randomUUID(),
            nombre,
            email,
            passwordHash,
            rol,
            createdAt: new Date()
        });
    }

    requiredText(value, field){
        if(typeof value !== 'string' || value.trim().length === 0){
            throw new ValidationError(`${field} es obligatorio y debe ser texto`)
        }
        const normalized = value.trim()
        if(normalized.length > 160){
            throw new ValidationError(`${field} no puede superar 160 caracteres`)
        }
        return normalized;
    }

    validEmail(value){
        const email = this.requiredText(value, 'email').toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            throw new ValidationError('email debe tener un formato válido.');
        }
        return email;
    }

    validPassword(value){
        if(typeof value !== 'string' || value.length < 6){
            throw new ValidationError('password es obligatorio y debe tener al menos 6 caracteres.');
        }
        if(value.length > 100){
            throw new ValidationError('password no puede superar 100 caracteres.');
        }
        return value;
    }

    validRol(value){
        if(value === undefined || value === null || value === ''){
            return 'CLIENTE';
        }
        if(value !=='CLIENTE' && value !== 'ADMIN'){
            throw new ValidationError('rol debe ser CLIENTE o ADMIN.');
        }

        return value;
    }


}