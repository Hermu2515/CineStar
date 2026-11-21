import { Router } from 'express';

export function createReservaRoutes(controller, authenticateToken) {
  const router = Router();

  router.get('/reservas/mias', authenticateToken, (request, response, next) => {
    void controller.listMias(request, response, next);
  });

  router.post('/reservas', authenticateToken, (request, response, next) => {
    void controller.create(request, response, next);
  });

  router.patch('/reservas/:id/confirmar', authenticateToken, (request, response, next) => {
    void controller.confirm(request, response, next);
  });

  router.delete('/reservas/:id', authenticateToken, (request, response, next) => {
    void controller.cancel(request, response, next);
  });

  return router;
}