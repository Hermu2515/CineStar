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
//Valisa lo que va enviar mi usuario

//Función auxiliar que prepara el entorno
//Si una prueba es llamada vaica, el estado base es
//ESTRENO, con 50 asientos y sin reservas
function setup({ peliculaEstado = 'ESTRENO', capacidadTotal = 50, reservasActivas = [] } = {}) {
  const pool = { query: vi.fn(), connect: vi.fn() };
  //Simula una conexión falsa a la base de datos
  //la primera es para ejecutar consultas y la segunda
  //para pedir un cliente y abrir transacciones
  const reservaRepo = new PostgresReservaRepository(pool);
  const funcionRepo = new PostgresFuncionRepository(pool);
  const peliculaRepo = new PostgresPeliculaRepository(pool);
  //Igual que en app crea las instancias de los repositorios

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
  /*Entonces se podría decir que nosotros le pasamos nuestro 
  validInput a CreateReservaService, y esta en algún punto llama al 
  repositorio de peliculas que tiene el pool falso, para buscar si el 
  id de la pelicula es el necesario, y para que no se aplique una 
  consulta SQL de verdad, utilizamos mockImplementation, para haer 
  una función de JS que simule la logica y el resultado */

  vi.spyOn(reservaRepo, 'findAll').mockResolvedValue(reservasActivas);
  //esta linea sirve para verficar si hay asientos ocupados  
  //Aquí se llama al repositorio de reservas y la función
  //findAll para ver las funciones activas
  //se usa mockResolvedValue, porque a diferencia de las 2 anteiores
  //no vas a regresar un dato si esta bien y otro si esta mal
  //solo vas a regresar ese lista.
  const createReserva = vi
    .spyOn(reservaRepo, 'create')
    .mockImplementation(async (reserva) => reserva);
//Aqui en una variable guardas los datos de crear una reserva
//Le pide vi. que simule el método create de reservarRepo
//Y utilizar .mockimpmentation, para que me regrese la reserva
  const service = new CreateReservaService(reservaRepo, funcionRepo, peliculaRepo);
  return { service, createReserva };
}

/*pero entonces cuando createReservaService, para hacer sus validaciones de postgreRepostorio y este llame a sus métodos, entonces lo qeu s eva a correr es lor que esta en los espias */

describe('CreateReservaService', () => {
//Aquí es donde se define el bloque real de prubeas
//bajo el nombre de el servició
  it('normaliza los asientos, calcula el total y envía el bloqueo temporal al repositorio', async () => {
    //Aquí decimos lo que hara esta prueba
    const { service, createReserva } = setup();
    //Extraemos el servicio simuladoo y las reservas
    const result = await service.execute(validInput);
    //Aquí se le pasan los datos de la petición al método execute

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.asientos).toEqual(['A1', 'A2']);
    expect(result.total).toBe(17);
    expect(result.estado).toBe('BLOQUEADA');
    expect(new Date(result.expiraEn).getTime()).toBeGreaterThan(Date.now());
    expect(createReserva).toHaveBeenCalledTimes(1);
    /*Aquí demuestra lo que se espera obtener, en donde
    en la primera linea, dice que el id debe tener 36 caracteres
    compuesta por numeros del 0 al 9, de la a la f y guiones */
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
/*No me digas aqui se simula una prueba en donde los asientos estan vacios o dupliclados, la primera parte espera que al pasar el input, y una lista de asientos vacios, se me rechace al no contener ningun asiento



la segunda se espera que al pasar el input y asientos 
duplicados, se me muestre un mensaje que los asientos estan 
duplicados y al final se espera que no se llame al mètodo de 
crear del repositorio que tiene por nombre createReserva */
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