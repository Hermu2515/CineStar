/*Estos contratos sirve como las clases con ABC de python, cada clase
hija de persistencia, tiene que incluir y sobreescribir estos métodos o
daran error */
class UsuarioRepository {
  async buscarPorEmail(email) {
    throw new Error("Método buscarPorEmail() no implementado.");
  }

  async buscarPorId(id) {
    throw new Error("Método buscarPorId() no implementado.");
  }

  async guardar(usuario) {
    throw new Error("Método guardar() no implementado.");
  }
}

module.exports = UsuarioRepository;
