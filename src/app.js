import express from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PostgresUsuarioRepository } from "./persistence/PostgresUsuarioRepository.js";
import { PostgresPeliculaRepository } from "./persistence/PostgresPeliculaRepository.js";
import { PostgresFuncionRepository } from "./persistence/PostgresFuncionRepository.js";
import { PostgresReservaRepository } from "./persistence/PostgresReservaRepository.js";

import { RegisterUserService } from "./application/RegisterUserService.js";
import { LoginUserService } from "./application/LoginUserService.js";
import { CreatePeliculaService } from "./application/CreatePeliculaService.js";
import { ListPeliculasService } from "./application/ListPeliculasService.js";
import { CreateFuncionService } from "./application/CreateFuncionService.js";
import { ListFuncionesService } from "./application/ListFuncionesService.js";
import { CreateReservaService } from "./application/CreateReservaService.js";
import { ConfirmReservaService } from "./application/ConfirmReservaService.js";
import { CancelReservaService } from "./application/CancelReservaService.js";
import { ListMisReservasService } from "./application/ListMisReservasService.js";
import {GetUsuariosService} from "./application/GetUsuarioService.js"

import { createAuthMiddlewares } from "./presentation/authMiddleware.js";
import { AuthController } from "./presentation/AuthController.js";
import { createAuthRoutes } from "./presentation/authRoutes.js";
import { PeliculaController } from "./presentation/PeliculaController.js";
import { createPeliculaRoutes } from "./presentation/peliculaRoutes.js";
import { FuncionController } from "./presentation/FuncionController.js";
import { createFuncionRoutes } from "./presentation/funcionRoutes.js";
import { ReservaController } from "./presentation/ReservaController.js";
import { createReservaRoutes } from "./presentation/reservaRoutes.js";
import { errorHandler } from "./presentation/errorHandler.js";

export function createApp(pool, jwtSecret = process.env.JWT_SECRET) {
  const app = express();

  // 1. Persistencia
  const usuarioRepository = new PostgresUsuarioRepository(pool);
  const peliculaRepository = new PostgresPeliculaRepository(pool);
  const funcionRepository = new PostgresFuncionRepository(pool);
  const reservaRepository = new PostgresReservaRepository(pool);

  // 2. Aplicación (Casos de uso)
  const registerUserService = new RegisterUserService(usuarioRepository);
  const getUsuariosService = new GetUsuariosService(usuarioRepository)
  const loginUserService = new LoginUserService(usuarioRepository, jwtSecret);
  const createPeliculaService = new CreatePeliculaService(peliculaRepository);
  const listPeliculasService = new ListPeliculasService(peliculaRepository);
  const createFuncionService = new CreateFuncionService(
    funcionRepository,
    peliculaRepository,
  );
  const listFuncionesService = new ListFuncionesService(
    funcionRepository,
    reservaRepository,
  );
  const createReservaService = new CreateReservaService(
    reservaRepository,
    funcionRepository,
    peliculaRepository,
  );
  const confirmReservaService = new ConfirmReservaService(reservaRepository);
  const cancelReservaService = new CancelReservaService(reservaRepository);
  const listMisReservasService = new ListMisReservasService(reservaRepository);
  
  // 3. Presentación (Middlewares y controladores)
  const { authenticateToken, requireAdmin } = createAuthMiddlewares(jwtSecret);
  const authController = new AuthController(
    registerUserService,
    loginUserService,
    getUsuariosService,
  );
  const peliculaController = new PeliculaController(
    createPeliculaService,
    listPeliculasService,
  );
  const funcionController = new FuncionController(
    createFuncionService,
    listFuncionesService,
  );
  const reservaController = new ReservaController(
    createReservaService,
    confirmReservaService,
    cancelReservaService,
    listMisReservasService,
  );

  app.use(express.json());
  app.get('/health', (_request, response) => response.status(200).json({ status: 'ok' }));
  app.get('/openapi.yaml', (_request, response, next) => {
    try {
      const document = readFileSync(resolve(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');
      response.type('application/yaml').send(document);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', createAuthRoutes(authController, authenticateToken, requireAdmin));
  app.use('/api', createPeliculaRoutes(peliculaController, authenticateToken, requireAdmin));
  app.use('/api', createFuncionRoutes(funcionController, authenticateToken, requireAdmin));
  app.use('/api', createReservaRoutes(reservaController, authenticateToken));

  app.use(errorHandler);

  return app;
}
