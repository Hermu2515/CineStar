import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../application/errors.js';

export function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  if (error instanceof ValidationError) {
    return response.status(400).json({ error: error.message });
  }
  if (error instanceof UnauthorizedError) {
    return response.status(401).json({ error: error.message });
  }
  if (error instanceof ForbiddenError) {
    return response.status(403).json({ error: error.message });
  }
  if (error instanceof NotFoundError) {
    return response.status(404).json({ error: error.message });
  }
  if (error instanceof ConflictError) {
    return response.status(409).json({ error: error.message });
  }

  console.error('Error no controlado en la solicitud:', error);
  return response.status(500).json({ error: 'Ocurrió un error interno.' });
}