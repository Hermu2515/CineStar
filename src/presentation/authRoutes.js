import { Router } from 'express';

export function createAuthRoutes(controller) {
  const router = Router();

  router.post('/auth/register', (request, response, next) => {
    void controller.register(request, response, next);
  });

  router.post('/auth/login', (request, response, next) => {
    void controller.login(request, response, next);
  });

  return router;
}