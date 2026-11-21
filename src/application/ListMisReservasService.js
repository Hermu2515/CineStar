export class ListMisReservasService{
    constructor(reservas){
        this.reservas = reservas
    }
    async execuste(usuarioId){
        const todas = await this.reservas.findAll();
        return todas.filter((reserva) => reserva.usuarioId === usuarioId)
    }
}
