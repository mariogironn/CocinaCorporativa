# Roles y accesos (backend requerido)

Tu frontend ya aplica permisos por rol, pero para que ADMIN asigne roles a otros usuarios de forma real en BD hacen falta endpoints nuevos.

## Endpoints minimos

1. GET /api/Usuarios/me
- Retorna perfil del usuario autenticado.

2. PUT /api/Usuarios/me
- Actualiza perfil propio (nombre, telefono, correo, sedeNombre, areaTrabajo, avatarUrl).

3. POST /api/Usuarios/me/avatar
- Sube foto de avatar y devuelve avatarUrl.

4. GET /api/Roles
- Lista roles disponibles (ADMIN, CHEF, SUPERVISOR, AUXILIAR, EMPLEADO).

5. GET /api/Usuarios
- Solo ADMIN: lista usuarios con rol actual.

6. PUT /api/Usuarios/{usuarioId}/rol
- Solo ADMIN: cambia rol de un usuario.

7. GET /api/Permisos/rol/{rol}
- Devuelve permisos del rol para auditar en UI.

## DTO sugerido (perfil)

```json
{
  "usuarioId": 1,
  "username": "chef_maria",
  "nombreCompleto": "Maria Lopez",
  "rol": "CHEF",
  "sedeNombre": "Zona 1",
  "areaTrabajo": "Cocina caliente",
  "telefono": "+502 5555-5555",
  "correo": "maria@empresa.com",
  "avatarUrl": "https://.../avatar.jpg"
}
```

## Matriz de permisos recomendada

- ADMIN: acceso total.
- CHEF: ver dashboard, gestionar menu, editar corte, guardar/eliminar foto, editar perfil propio.
- SUPERVISOR: similar a CHEF sin gestion de roles.
- AUXILIAR: ver dashboard/menu, editar perfil propio.
- EMPLEADO: solo lectura dashboard/menu y perfil propio sin cambios sensibles.

## Nota
Si no existen endpoints 4-7, el frontend no puede otorgar rol real a otros usuarios; solo puede mostrar/restringir segun rol actual del token/localStorage.
