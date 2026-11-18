En una arquitectura monolítica de capas cerradas, la capa de Dominio (src/domain/) es el núcleo de CineStar y se escribe en JavaScript puro, sin importar express, pg ni bcrypt. Además, para evitar el antipatrón sumidero (sinkhole) visto en clase —donde las clases son simples contenedores vacíos sin lógica—, cada entidad debe proteger sus propias reglas de negocio.


src/domain/entities/Usuario.js
Representa a cualquier persona registrada en CineStar (tanto clientes que compran entradas como administradores que gestionan funciones) y protege dos reglas críticas:

Solo existen los roles CLIENTE y ADMIN.

Nunca almacena ni expone contraseñas en texto plano (atendiendo directamente la observación de tu rúbrica sobre QA-02 respecto a la ausencia de contraseñas expuestas).

src/domain/entities/Funcion.js
que representa cada proyección de película programada en CineStar (como la cartelera que consulta el cliente o las funciones que crea el administrador).
Objetivo del archivo
Controla los datos válidos de una función en cartelera y protege tres reglas críticas del negocio:

Toda función debe tener película, sala, horario y un precio de entrada mayor a cero.

El número de asientos ocupados no puede superar la capacidad física de la sala.

Antes de crear una reserva, verifica si los asientos elegidos por el cliente realmente están libres (evitando ventas duplicadas).

src/domain/entities/Reserva.js
Representa la transacción de reserva o compra de entradas de un cliente para una función específica. Al igual que las entidades anteriores, encapsula reglas de negocio reales para evitar que el dominio sea un simple contenedor de datos sin comportamiento (antipatrón sumidero):   Toda reserva debe estar vinculada a un usuario y a una función válida.Debe incluir al menos un asiento, no puede superar un máximo por compra (por ejemplo, 10 entradas) y no puede contener asientos duplicados en la misma solicitud.Calcula automáticamente el monto total a pagar según el precio unitario de la función.Controla el ciclo de vida de la reserva (BLOQUEADA, CONFIRMADA, EXPIRADA, CANCELADA) y valida que el bloqueo temporal de los asientos no haya vencido al confirmar el pago.

src/domain/repositories/
Según la regla de dependencias vista en clase, la capa de Persistencia debe implementar contratos definidos hacia el núcleo para que el Dominio nunca dependa de detalles técnicos como PostgreSQL o la librería pg. Como trabajamos en JavaScript puro reamos clases base cuyos métodos lanzan un error si el repositorio de PostgreSQL olvida implementarlos.

src/domain/repositories/UsuarioRepository.js
Establece qué operaciones de acceso a datos necesita el negocio sobre los usuarios (buscar por correo, buscar por identificador y guardar un nuevo registro), sin especificar cómo ni dónde se almacenan.

src/domain/repositories/FuncionRepository.js
Define qué operaciones necesita el negocio sobre las funciones de cine (consultar la cartelera, obtener el detalle de una función con sus asientos ocupados y registrar nuevas funciones), sin revelar cómo se guardan en PostgreSQL.

src/domain/repositories/ReservaRepository.js
Cierra la capa de Dominio definiendo el contrato de acceso a datos para las reservas (guardar, consultar y actualizar su estado), manteniendo las reglas de negocio aisladas de PostgreSQL para que la capa de Persistencia implemente estos métodos más adelante.