import { Router } from 'express';

export function createFuncionRoutes(controller, authenticateToken, requireAdmin) {
  const router = Router();

  router.get('/funciones', (request, response, next) => {
    void controller.list(request, response, next);
  });

  router.post('/funciones', authenticateToken, requireAdmin, (request, response, next) => {
    void controller.create(request, response, next);
  });

  return router;
}