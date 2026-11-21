import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../application/errors.js';

export function createAuthMiddlewares(jwtSecret){
    function authenticateToken(req, _res, next){
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')){
            return next(new UnauthorizedError('Token de autenticación requerido.'))
        }
        const token = authHeader.slice(7).trim();
        try{
            const payload = jwt.verify(token, jwtSecret);
            req.user = payload;
            return next();
        }catch{
            return next(new UnauthorizedError('Token inválido o expirado.'))
        }
    }

    function requireAdmin(req, _res, next){
        if(!req.user || req.user.rol !== 'ADMIN'){
            return next(new ForbiddenError('Acceso denegado: se requiere rol ADMIN.'));
        }
        return next()
    }
    return {authenticateToken, requireAdmin }

    
}