export class ListFuncionesService {
  constructor(funciones, reservas) {
    this.funciones = funciones;
    this.reservas = reservas;
  }

  async execute(filters = {}) {
    const todasFunciones = await this.funciones.findAll();
    const todasReservas = await this.reservas.findAll();
    const ahora = new Date();

    const filtradas = todasFunciones.filter((funcion) => {
      if (filters.peliculaId && funcion.peliculaId !== String(filters.peliculaId).trim()) {
        return false;
      }
      if (filters.fecha) {
        const fechaFuncion = new Date(funcion.horarioInicio).toISOString().slice(0, 10);
        if (fechaFuncion !== String(filters.fecha).trim()) {
          return false;
        }
      }
      return true;
    });

    return filtradas.map((funcion) => {
      const reservasActivas = todasReservas.filter(
        (r) =>
          r.funcionId === funcion.id &&
          (r.estado === 'CONFIRMADA' || (r.estado === 'BLOQUEADA' && new Date(r.expiraEn) > ahora)),
      );

      const asientosOcupados = [...new Set(reservasActivas.flatMap((r) => r.asientos))].sort();

      return {
        ...funcion,
        asientosOcupados,
        asientosDisponibles: Math.max(0, funcion.capacidadTotal - asientosOcupados.length),
      };
    });
  }
}