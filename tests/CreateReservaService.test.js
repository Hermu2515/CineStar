import { describe, expect, it, vi } from 'vitest';
import { CreateReservaService } from '../src/application/CreateReservaService.js';
import { ConflictError, NotFoundError, ValidationError } from '../src/application/errors.js';
import { PostgresFuncionRepository } from '../src/persistence/PostgresFuncionRepository.js';
import { PostgresPeliculaRepository } from '../src/persistence/PostgresPeliculaRepository.js';
import { PostgresReservaRepository } from '../src/persistence/PostgresReservaRepository.js';

const validInput = {
  usuarioId: 'user-1',
  funcionId: 'fun-1',
  asientos: [' a1 ', 'a2'],
};

function setup({ peliculaEstado = 'ESTRENO', capacidadTotal = 50, reservasActivas = [] } = {}) {
  const pool = { query: vi.fn(), connect: vi.fn() };
  const reservaRepo = new PostgresReservaRepository(pool);
  const funcionRepo = new PostgresFuncionRepository(pool);
  const peliculaRepo = new PostgresPeliculaRepository(pool);

  vi.spyOn(funcionRepo, 'findById').mockImplementation(async (id) => {
    if (id !== 'fun-1') return null;
    return {
      id: 'fun-1',
      peliculaId: 'pel-1',
      sala: 'Sala 1',
      precioEntrada: 8.5,
      capacidadTotal,
    };
  });

  vi.spyOn(peliculaRepo, 'findById').mockImplementation(async (id) => {
    if (id !== 'pel-1') return null;
    return {
      id: 'pel-1',
      titulo: 'Interestelar',
      estado: peliculaEstado,
      duracionMinutos: 160,
    };
  });

  vi.spyOn(reservaRepo, 'findAll').mockResolvedValue(reservasActivas);
  const createReserva = vi
    .spyOn(reservaRepo, 'create')
    .mockImplementation(async (reserva) => reserva);

  const service = new CreateReservaService(reservaRepo, funcionRepo, peliculaRepo);
  return { service, createReserva };
}

describe('CreateReservaService', () => {
  it('normaliza los asientos, calcula el total y envía el bloqueo temporal al repositorio', async () => {
    const { service, createReserva } = setup();
    const result = await service.execute(validInput);

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.asientos).toEqual(['A1', 'A2']);
    expect(result.total).toBe(17);
    expect(result.estado).toBe('BLOQUEADA');
    expect(new Date(result.expiraEn).getTime()).toBeGreaterThan(Date.now());
    expect(createReserva).toHaveBeenCalledTimes(1);
  });

  it('rechaza asientos vacíos o duplicados y no llama al repositorio', async () => {
    const { service, createReserva } = setup();

    await expect(
      service.execute({ ...validInput, asientos: [] }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      service.execute({ ...validInput, asientos: ['B1', 'b1'] }),
    ).rejects.toThrow('No se permiten asientos duplicados en la misma solicitud.');

    expect(createReserva).not.toHaveBeenCalled();
  });

  it('rechaza campos no permitidos en el cuerpo de entrada', async () => {
    const { service, createReserva } = setup();

    await expect(
      service.execute({ ...validInput, descuentoExtra: 50 }),
    ).rejects.toThrow('El campo descuentoExtra no está permitido.');

    expect(createReserva).not.toHaveBeenCalled();
  });

  it('rechaza con NotFoundError si la función no existe', async () => {
    const { service, createReserva } = setup();

    await expect(
      service.execute({ ...validInput, funcionId: 'fun-inexistente' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(createReserva).not.toHaveBeenCalled();
  });

  it('rechaza con ConflictError si la película está en estado PREVENTA', async () => {
    const { service, createReserva } = setup({ peliculaEstado: 'PREVENTA' });

    await expect(service.execute(validInput)).rejects.toThrow(
      'La película no está habilitada para emisión de boletos.',
    );

    expect(createReserva).not.toHaveBeenCalled();
  });

  it('impide reservas duplicadas sobre asientos ya bloqueados o confirmados (QA-01)', async () => {
    const { service, createReserva } = setup({
      reservasActivas: [
        {
          id: 'res-previa',
          usuarioId: 'otro-usuario',
          funcionId: 'fun-1',
          asientos: ['A1'],
          estado: 'BLOQUEADA',
          expiraEn: new Date(Date.now() + 120_000),
        },
      ],
    });

    await expect(service.execute(validInput)).rejects.toBeInstanceOf(ConflictError);
    expect(createReserva).not.toHaveBeenCalled();
  });
});