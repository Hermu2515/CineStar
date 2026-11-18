class ReservaRepository {
  async guardar(reserva) {
    throw new Error('Método guardar() no implementado.');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId() no implementado.');
  }

  async actualizarEstado(id, nuevoEstado) {
    throw new Error('Método actualizarEstado() no implementado.');
  }

  async listarPorUsuario(usuarioId) {
    throw new Error('Método listarPorUsuario() no implementado.');
  }
}

module.exports = ReservaRepository;