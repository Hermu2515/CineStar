src/persistence/PostgresUsuarioRepository.js
mplementa el contrato UsuarioRepository definido en el dominio. Se encarga de ejecutar consultas SQL seguras hacia la futura tabla usuarios y traducir las filas crudas de PostgreSQL de vuelta a instancias válidas de la entidad Usuario.

Parámetros $1, $2, $3, $4 en pool.query(query, valores):
Nunca concatenamos variables directamente dentro del texto SQL (como WHERE email = '${email}') porque eso abriría una vulnerabilidad de inyección SQL. Al usar marcadores $1, $2..., el controlador pg envía la consulta y los datos por separado, neutralizando cualquier código malicioso que un usuario escriba en un formulario.

RETURNING id, nombre, email, password_hash, rol:
Es una instrucción propia de PostgreSQL que, inmediatamente después de insertar la fila, devuelve el registro completo incluyendo el id numérico que la base de datos generó automáticamente, evitando hacer un SELECT adicional.

_mapearAEntidad(fila):
Es un método auxiliar interno (el guion bajo _ es una convención para indicar que solo se usa dentro de esta clase). Convierte el objeto plano que devuelve PostgreSQL en una instancia real de new Usuario(...), asegurando que conserve sus métodos de dominio (esAdministrador() y toJSON()).

src/persistence/PostgresFuncionRepository.js
Implementa el contrato FuncionRepository definido en el dominio. Se encarga de consultar la cartelera, registrar nuevas funciones creadas por un administrador y reconstruir la entidad Funcion cargando dinámicamente los asientos que están ocupados o bloqueados temporalmente en esa sala.

src/persistence/PostgresReservaRepository.js
Implementa el contrato ReservaRepository definido en el dominio. Su responsabilidad más crítica es garantizar que una reserva y cada uno de sus asientos seleccionados se guarden juntos como una unidad indivisible (transacción SQL) en las tablas reservas y reserva_asientos, además de permitir consultar y actualizar el estado de las compras.