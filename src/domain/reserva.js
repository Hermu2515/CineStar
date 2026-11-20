/**
 * Modelo de datos de una reserva de boletos
 * @typedef {Object} Reserva
 * @property {string} id
 * @property {string} usuarioId
 * @property {string} funcionId
 * @property {string[]} asientos
 * @property {number} capacidadTotal
 * @property {'BLOQUEADA' | 'CONFIRMADA'} estado
 * @property {Date} expiraEn
 * @property {Date} createdAt
 * 
 * @typedef {Object} CreateReservaInput
 * @property {unknown} usuarioId
 * @property {unknown} funcionId
 * @property {unknown} asientos
 */
export {};