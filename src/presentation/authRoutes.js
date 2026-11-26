import { Router } from 'express';

export function createAuthRoutes(controller,  authenticateToken, requireAdmin) {
  const router = Router();

  router.post('/auth/register', (request, response, next) => {
    void controller.register(request, response, next);
  });

  router.post('/auth/login', (request, response, next) => {
    void controller.login(request, response, next);
  });

  router.get('/auth/users', authenticateToken, requireAdmin, (request, response, next) => {
    void controller.getAll(request, response, next);
  });

  return router;
}