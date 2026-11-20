/**
 * Modelo de datos de un usuario en CineStar
 * @typedef {Object} Usuario
 * @property {string} id
 * @property {string} nombre
 * @property {string} email
 * @property {string} [passwordHash]
 * @property {'CLIENTE'| 'ADMIN'} rol
 * @property {Date} createdAt
 *
 * @typedef {Object} RegisterUserInput
 * @property {unknown} nombre
 * @property {unknown} email
 * @property {unknown} password
 * @property {unknown} [rol]
 * 
 * @typedef {Object} LoginUserInput
 * @property {unknown} email
 * @property {unknown} password
 */

export {};
