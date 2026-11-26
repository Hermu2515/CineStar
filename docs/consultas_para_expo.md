Guía de Demo en Postman – CineStar API (6 minutos)

Logear al inicio de la expo para tener nuevos tokens

1 Login Admin
Método: POST http://localhost:3000/api/auth/login`
{
  "email": "superadmin@cinestar.com",
  "password": "Cine2026!"
}

2 Login Cliente

Método: POST http://localhost:3000/api/auth/login

{
  "email": "ana@correo.com",
  "password": "Cine2026!"
}

3 Vista Administrativa y Roles
Método: GET http://localhost:3000/api/auth/users
Usar el token del admin

4 Consultar Cartelera y Funciones
Método: GET http://localhost:3000/api/peliculas

Método: GET http://localhost:3000/api/funciones
No se requiere token

5 Crear Reserva con Bloqueo de 5 Minutos 
Método: POST http://localhost:3000/api/reservas
Usuario: ana@correo.com/token
{
  "usuarioId": "6395657f-3a44-4ccc-8d67-d4eb055bfbad",
  "funcionId": "9ae24acb-885a-44e3-8750-45b93b86f262",
  "asientos": ["D1", "D2"]
}

6 Probar Conflicto de Asiento Ocupado
Método: POST http://localhost:3000/api/reservas
Usuario: superadmin@cinestar.com/tokenadmin
{
  "usuarioId": "69776821-50cd-40e1-a29b-6f7bb263e70e",
  "funcionId": "9ae24acb-885a-44e3-8750-45b93b86f262",
  "asientos": ["D1"]
}

7 Confirmar Reserva y Consultar Historial
Método: PATCH http://localhost:3000/api/reservas/ID_RESERVA/confirmar
Usuario: ana@correo.com/token
Método: GET http://localhost:3000/api//reservas/mias
Usuario: ana@correo.com/token