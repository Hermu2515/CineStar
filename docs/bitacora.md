# Bitácora del proyecto — CineStar

- **Integrante:** Andrés Ignacio Hernández Muñoz
- **Cátedra:** Arquitectura en Software — Cuarto Nivel (PUCE)
- **Repositorio:** https://github.com/Hermu2515/CineStar.git

## Matriz de trazabilidad con drivers arquitectónicos
- **Casos de Uso:**
  - `CU-01`: Reservar boletos de cine (selección de asientos con bloqueo temporal, consulta personal, confirmación de pago y cancelación previa).
  - `CU-02`: Gestionar películas y funciones (registro en cartelera, programación de horarios/salas y validación de cruces de horario).
  - `CU-03`: Consultar cartelera y horarios (listado y filtrado por estado/género para clientes).
- **Restricciones Pertinentes:**
  - `R-01`: Ejecución en entorno local utilizando Node.js y PostgreSQL sin costos de infraestructura en la nube.
  - `R-02`: Registro e inicio de sesión obligatorio para realizar reservas o acciones administrativas.
  - `R-03`: Prohibición de cancelar o anular una reserva una vez que ha sido confirmada por el usuario (`409 Conflict`).
- **Escenarios de Calidad (Priorización QAW):**
  - `QA-02` *(Seguridad — Crítica, prioridad 1)*: Cifrado de contraseñas con Bcrypt ($p = 0$ en texto plano) y uso estricto de consultas SQL parametrizadas (100 %).
  - `QA-01` *(Usabilidad / Concurrencia — Crítica, prioridad 2)*: Bloqueo temporal de asientos seleccionados en preventa con $p = 0$ de reservas duplicadas.
  - `QA-03` *(Seguridad / Control de Acceso — Alta, prioridad 1)*: Rechazo mediante middleware con HTTP `403 Forbidden` ante intentos de acceso no autorizado a rutas de `ADMIN`.
  - `QA-04` *(Disponibilidad — Alta, prioridad 2)*: Manejo robusto de pool de conexiones y excepciones en PostgreSQL ante fallos temporales.
  - `QA-05` *(Usabilidad / Gestión — Media)*: Validación clara de campos obligatorios y formatos en operaciones administrativas.

---

## Semana 1 — Inicio y levantamiento inicial
- Fecha: 30/10/2026
- Integrantes presentes: Andrés Ignacio Hernández Muñoz
- Flujos y drivers atendidos: Definición de visión, alcance, interesados, casos de uso primarios (CU-01 reservar boletos, CU-02 gestionar películas y funciones, CU-03 consultar cartelera y horarios), restricciones iniciales (R-01 entorno local con Node.js y PostgreSQL, R-02 inicio de sesión obligatorio, R-03 no cancelación de reservas confirmadas) y preocupaciones iniciales de calidad (usabilidad, seguridad y disponibilidad).
- Archivos o componentes modificados: Ninguno en el repositorio de código; en esta etapa solo se elaboró el documento inicial de requerimientos y arquitectura (Parte 1).
- Pruebas ejecutadas: Revisión documental de coherencia entre las fuentes de información (F-01 clientes, F-02 administrador del cine, F-03 documento SRS de referencia), los supuestos iniciales y los flujos de cada caso de uso.
- Resultado y decisiones tomadas:
  - Se delimitó lo que entra en el sistema (base de datos relacional, cartelera con filtros, selección de asientos, reservas, autenticación y panel administrativo) y lo que queda fuera (pasarelas de pago reales, aplicación móvil nativa y sistema de puntos).
  - Se estableció que la aplicación correrá en un entorno local con Node.js y PostgreSQL para evitar costos de hosting en la nube (R-01).
  - Se dejaron planteadas las preocupaciones iniciales de calidad sin métricas cerradas todavía.
- Dudas pendientes y próximos pasos: Definir cómo se van a cifrar las contraseñas, establecer el tiempo exacto de bloqueo temporal de asientos durante una reserva, confirmar si los pósters se manejarán como enlaces web o archivos locales y transformar las preocupaciones de calidad en escenarios medibles.

## Semana 2 — Refinamiento de requisitos, taller QAW y trade-offs
- Fecha: 06/11/2026
- Integrantes presentes: Andrés Ignacio Hernández Muñoz
- Flujos y drivers atendidos: Refinamiento de alcance, fuentes y restricciones (R-01 a R-03), y formalización de los escenarios de calidad QA-01 a QA-05 mediante el método QAW.
- Archivos o componentes modificados: Documento de arquitectura (Criterio 1 Parte 2); aún sin código implementado en el repositorio.
- Pruebas ejecutadas: Revisión de consistencia entre el árbol de utilidad, los escenarios de 6 campos del QAW y los protocolos de verificación definidos para cada atributo.
- Resultado y decisiones tomadas:
  - Se acotó el alcance agregando un sistema de notificaciones de éxito o fallo para el cliente, se reordenaron las fuentes colocando al administrador del cine (F-01) como patrocinador principal, se agregaron fechas secuenciales y se documentaron las referencias del estándar IEEE 830-1998 y del SRS de dominio (F-03).
  - Se reemplazaron las dudas abiertas por metas medibles: completar reservas en máximo 4 clics y menos de 2 minutos (QA-01), cero contraseñas en texto plano usando Bcrypt y 100 % de consultas SQL parametrizadas (QA-02), rechazo con HTTP 403 ante accesos no autorizados de clientes a rutas de administración (QA-03) y tiempos de respuesta menores a 2 segundos con 50 usuarios concurrentes (QA-04).
  - Se resolvieron los empates de priorización ordenando el desarrollo: primero seguridad base (QA-02), luego concurrencia en reservas (QA-01) y control de acceso por roles (QA-03). También se analizaron los trade-offs entre seguridad vs. usabilidad (costo de Bcrypt) y disponibilidad vs. rendimiento de escritura en PostgreSQL.
  - Se cerraron los supuestos técnicos asumiendo un bloqueo temporal de asientos controlado por estado y el uso de URLs externas para los pósters de películas.
- Dudas pendientes y próximos pasos: Iniciar la construcción del proyecto desde cero creando los archivos base de configuración, el esquema SQL en PostgreSQL, las capas de la aplicación, el contrato OpenAPI y las pruebas.

## Semana 5 — Implementación, contrato y pruebas
- Integrantes presentes: Andrés Ignacio Hernández Muñoz
- Flujos revisados: registro e inicio de sesión, gestión de cartelera y funciones con cruce de horarios, creación y consulta personal de reservas, confirmación de pago y cancelación.
- Contrato: `docs/openapi.yaml` (OpenAPI 3.0.3), servido en `/openapi.yaml`.
- Pruebas: unitarias, repositorio y HTTP con `Pool` simulado; ver `tests/`, además de pruebas funcionales en Postman conectadas a PostgreSQL.

### Avance 1 — Configuración base, esquema SQL y capas de dominio y persistencia
- Fecha: 20/11/2026
- Flujo o driver atendido: R-01 (entorno local con Node.js y PostgreSQL), QA-02 (seguridad en consultas SQL parametrizadas y estructura de usuarios) y QA-01 (persistencia transaccional de asientos).
- Archivos o componentes modificados: `.env`, `.env.example`, `.gitignore`, `package.json`, archivo de esquema SQL en PostgreSQL (`usuarios`, `peliculas`, `funciones`, `reservas`, `reserva_asientos`), carpeta `src/domain/` y repositorios en `src/persistence/` (`PostgresUsuarioRepository.js`, `PostgresPeliculaRepository.js`, `PostgresFuncionRepository.js`, `PostgresReservaRepository.js`).
- Pruebas ejecutadas: Verificación de creación de tablas, llaves foráneas y restricciones en la base de datos local `cinestar_db`.
- Resultado: Se dejó lista la base del proyecto, la conexión a PostgreSQL mediante `DATABASE_URL`, las entidades del dominio y los repositorios con consultas preparadas (`$1..$n`) y transacciones (`BEGIN`, `COMMIT`, `ROLLBACK`) para evitar reservas duplicadas.
- Pendientes: Implementar los casos de uso en la capa de aplicación, los controladores, rutas y middlewares en presentación, y levantar el servidor Express.

### Avance 2 — Capas de aplicación y presentación, `app.js` y `server.js`
- Fecha: 21/11/2026
- Flujo o driver atendido: CU-01, CU-02, CU-03, R-02 (autenticación obligatoria con JWT), R-03 (restricción de no cancelar reservas confirmadas), QA-03 (control de acceso por roles ADMIN y CLIENTE) y QA-05 (validación de datos de entrada).
- Archivos o componentes modificados: Carpeta `src/application/` (servicios de autenticación, películas, funciones y reservas), carpeta `src/presentation/` (rutas, controladores y `authMiddleware.js`), `src/app.js` y `src/server.js`.
- Pruebas ejecutadas: Arranque local del servidor con `node --env-file=.env src/server.js` y verificación inicial de carga de rutas y conexión con PostgreSQL.
- Resultado: Se completó la arquitectura en capas conectando los endpoints HTTP con los servicios de negocio y PostgreSQL, incluyendo el cifrado de contraseñas con Bcrypt, la validación de cruce de horarios por sala y el bloqueo temporal de 5 minutos al reservar asientos.
- Pendientes: Ejecutar la suite de pruebas automatizadas, validar todos los endpoints contra PostgreSQL en Postman, revisar el contrato en `docs/openapi.yaml` y documentar la bitácora y el `README.md`.

### Avance 3 — Pruebas, contrato de API, bitácora y README
- Fecha: 21-22/11/2026
- Flujo o driver atendido: Verificación integral de CU-01, CU-02, CU-03, reglas R-01 a R-03 y escenarios QA-01, QA-02, QA-03 y QA-05.
- Archivos o componentes modificados: `tests/` (pruebas unitarias, de repositorio y HTTP), `docs/openapi.yaml`, `src/persistence/PostgresPeliculaRepository.js` (corrección de sintaxis SQL en `create`), `src/persistence/PostgresReservaRepository.js` (incorporación de `findByUsuarioId` para `GET /api/reservas/mias`), `docs/bitacora.md` y `README.md`.
- Pruebas ejecutadas: Ejecución de `npm test` y pruebas funcionales completas en Postman contra PostgreSQL (`/health`, `/openapi.yaml`, `/api/auth/register`, `/api/auth/login`, `/api/peliculas`, `/api/funciones`, `/api/reservas`, `/api/reservas/mias`, `/api/reservas/:id/confirmar` y `DELETE /api/reservas/:id`).
- Resultado:
  - La suite en `tests/` pasó sin errores.
  - En Postman se validaron los códigos esperados: `201 Created` al registrar usuarios, películas, funciones y reservas bloqueadas; `401 Unauthorized` al intentar reservar sin token o con credenciales incorrectas; `403 Forbidden` al intentar crear recursos con rol `CLIENTE` (QA-03); `409 Conflict` ante cruce de horarios en la misma sala, asientos ya bloqueados (QA-01) o intento de cancelar una reserva ya confirmada (R-03); y `200 OK` al consultar cartelera, listar reservas propias, confirmar pagos y cancelar reservas aún bloqueadas.
- Pendientes: Agregar `this.` en `this.toUsuario(result.rows[0])` dentro de `PostgresUsuarioRepository.findById`, habilitar el filtro opcional por `estado` en `PostgresPeliculaRepository.findAll`, dejar únicamente `PORT`, `DATABASE_URL` y `JWT_SECRET` en `.env.example` y realizar las pruebas de carga concurrente con 50 usuarios (QA-04).