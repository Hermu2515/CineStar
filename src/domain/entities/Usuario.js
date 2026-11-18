class Usuario {
    constructor({id = null, nombre, email, passwordHash, rol = 'CLIENTE'})
    {
        if (!nombre || nombre.trim().length < 2){
            throw new Error('El nombre del usuario es obligatorio y debe tener al menos 2 caracteres.');
        }

        if(!email || !email.includes('@')){
            throw new Error('Debe proporcionar un correo electrónico válido.');
        }

        if(!passwordHash){
            throw new Error('El usuario requiere una contraseña cifrada.');
        }

        const rolesPermitidos = ['CLIENTE', 'ADMIN'];
        if(!rolesPermitidos.includes(rol)){
            throw new Error(`Rol no válido. Debe ser uno de: ${rolesPermitidos.join(', ')}`);
        }

        this.id = id;
        this.nombre = nombre.trim();
        this.email = email.toLowerCase().trim();
        this.passwordHash = passwordHash;
        this.rol = rol;
    }   
    esAdministrador(){
        return this.rol === 'ADMIN';
    }
    toJSON(){
        return {
            id: this.id,
            nombre: this.nombre,
            email: this.email,
            rol: this.rol
        }
    }
}

module.exports = Usuario;