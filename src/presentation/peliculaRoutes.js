import { Router } from 'express';

export function createPeliculaRoutes(controller, authenticateToken, requireAdmin) {
  const router = Router();

  router.get('/peliculas', (request, response, next) => {
    void controller.list(request, response, next);
  });

  router.post('/peliculas', authenticateToken, requireAdmin, (request, response, next) => {
    void controller.create(request, response, next);
  });

  return router;
}