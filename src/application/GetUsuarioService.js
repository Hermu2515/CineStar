export class GetUsuariosService {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute() {
    return this.usuarioRepository.findAll();
  }
}