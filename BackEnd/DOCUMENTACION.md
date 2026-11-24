# UTN Slack — Documentación del Backend

Documentación del alcance del proyecto, arquitectura, rutas y endpoints implementados en `BackEnd/`.

---

## 1. Alcance del proyecto

El proyecto es un clon simplificado de **Slack**: una plataforma de mensajería organizada en **espacios de trabajo (Workspaces)** con **miembros y roles**, canales y mensajes.

### Alcance implementado (estado actual)

- **Autenticación y gestión de cuentas de usuario**
  - Registro de usuarios con verificación por email.
  - Login con emisión de token JWT (sesión sin estado).
  - Reenvío del mail de verificación.
  - Restablecimiento de contraseña (forgot / reset password) por token enviado por email.
- **Usuarios**
  - Listado de usuarios registrados y consulta de un usuario por ID (requieren autenticación).
- **Espacios de trabajo (Workspaces)**
  - Creación, listado (del usuario autenticado), consulta por ID, actualización y eliminación.
  - Gestión de membresías: listado de miembros y eliminación de un miembro.
  - Sistema de roles por workspace: `owner` (creador), `admin` y `user`.
- **Infraestructura**
  - Persistencia en **MongoDB (Atlas)** vía Mongoose.
  - Envío de emails transaccionales con **Nodemailer** (verificación de cuenta, reset de contraseña e invitaciones a workspaces).
  - Despliegue pensado para **Vercel Serverless Functions** (la app se exporta como handler; `app.listen` solo corre en desarrollo).

### Fuera de alcance (pendiente / planificado)

- Canales y mensajes de canal (`Channel`, `MessageChannel`) — modelos y repositorios planificados en el roadmap (ver archivo `readme` del backend).
- Mensajes directos (`DirectMessage`) — planificado, aún sin endpoints.

### Stack tecnológico

| Tecnología | Uso |
|---|---|
| Node.js + Express 5 | Servidor HTTP y enrutado |
| Mongoose 9 | ODM para MongoDB |
| jsonwebtoken (JWT) | Autenticación sin estado |
| bcrypt | Hash de contraseñas |
| Nodemailer | Envío de emails (verificación / reset) |
| cors + express.json | Middlewares globales |
| Vercel | Despliegue serverless |

---

## 2. Arquitectura

Estructura en capas (rutas → middlewares → controllers → services/repositories → modelos):

```
src/
├── main.js                  # Punto de entrada: monta middlewares globales y routers
├── config/                  # Configuración (MongoDB, mailer, variables de entorno)
├── models/                  # Schemas de Mongoose (User, Workspace, Member, Channel, etc.)
├── repositories/            # Acceso a datos (consultas Mongo)
├── services/                # Lógica de negocio (auth)
├── controllers/             # Capa HTTP: validan request y arman la respuesta
├── middlewares/             # auth, workspace (roles), manejo central de errores
├── routes/                  # Definición de rutas por dominio
└── utils/                   # ServerError, bcrypt, plantillas de email
```

---

## 3. Rutas base

Montadas en `src/main.js`:

| Router | Prefijo | Archivo |
|---|---|---|
| Autenticación | `/api/auth` | `src/routes/auth.router.js` |
| Usuarios | `/api/user` | `src/routes/user.router.js` |
| Workspaces | `/api/workspace` | `src/routes/workspace.router.js` |

---

## 4. Middlewares

Todos los endpoints pasan primero por los **middlewares globales** definidos en `main.js`:

1. **`cors()`** — habilita CORS para cualquier origen.
2. **`express.json()`** — parsea el body JSON.
3. **Conexión a MongoDB** — garantiza conexión a la base antes de resolver cualquier endpoint; si falla responde `503`.
4. **`errorHandlerMiddleware`** (al final) — captura todos los errores lanzados por los endpoints y responde con `ok: false`, el `status` correspondiente (o `500` genérico) y el `message`.

Middlewares de ruta:

| Middleware | Alcance | Función |
|---|---|---|
| `authMiddleware` (`src/middlewares/auth.middleware.js`) | Todos los endpoints de `/api/user` y `/api/workspace` | Lee el header `Authorization: Bearer <token>`, verifica la firma JWT, extrae `{id, name, email}` y lo expone en `req.user`. Header ausente/inválido/expirado → `400` o `401`. |
| `workspaceMiddleware(valid_roles)` (`src/middlewares/workspace.middleware.js`) | Endpoints de workspace con `:workspace_id` | Valida que el workspace exista (`404`), que el usuario tenga membresía (`403`) y, si `valid_roles` no está vacío, que su rol (`owner`/`admin`/`user`) esté permitido (`403`). Expone `req.workspace` y `req.membership`. |
| `errorHandlerMiddleware` (`src/middlewares/error.middleware.js`) | Todos los endpoints | Manejo centralizado de errores: errores esperados (con `status`) responden su código; errores inesperados responden `500`. |

---

## 5. Endpoints implementados

> Convención de respuesta: todos los endpoints devuelven JSON con las propiedades `ok`, `status`, `message` y (cuando aplica) `data`.

### 5.1 Módulo de Autenticación — `/api/auth`

**Middlewares que alcanzan cada endpoint:** solo los globales (CORS, body parser, conexión a DB, error handler). **No requieren token** — son públicos, ya que sirven justamente para obtener o recuperar la credencial.

| Método | Ruta | Middleware de ruta | Finalidad |
|---|---|---|---|
| `POST` | `/api/auth/register` | — (público) | Registra un usuario. Valida nombre, email (formato) y password; hashea la contraseña y envía un mail con el link de verificación (con token). Responde `201`. La respuesta es ambigua a propósito: no revela si el email ya existe. |
| `POST` | `/api/auth/login` | — (público) | Inicia sesión. Verifica credenciales (bcrypt) y devuelve un **JWT de sesión** en `data.authToken`, que se usará en el header `Authorization` del resto de endpoints. |
| `GET` | `/api/auth/verify-email` | — (público) | Verifica la cuenta desde el link del mail. Recibe `verification_token` por **querystring** y marca la cuenta como verificada. |
| `POST` | `/api/auth/resend-verification-email` | — (público) | Reenvía el mail de verificación a un email registrado y no verificado. Es `POST` por ser una operación con efectos secundarios. |
| `POST` | `/api/auth/forgot-password` | — (público) | Solicitud de restablecimiento: envía un mail con un token de reset si la cuenta existe. Respuesta ambigua para evitar *user enumeration*. |
| `POST` | `/api/auth/reset-password` | — (público) | Restablece la contraseña: valida el `reset_token` recibido por mail y guarda la nueva password (hasheada). |

### 5.2 Módulo de Usuarios — `/api/user`

**Middlewares que alcanzan cada endpoint:** globales + `authMiddleware`. Todos requieren token JWT válido.

| Método | Ruta | Middleware de ruta | Finalidad |
|---|---|---|---|
| `GET` | `/api/user` | `authMiddleware` | Devuelve el listado completo de usuarios registrados. |
| `GET` | `/api/user/:userId` | `authMiddleware` | Devuelve los detalles de un usuario por ID; `404` si no existe. |

### 5.3 Módulo de Workspaces — `/api/workspace`

**Middlewares que alcanzan cada endpoint:** globales + `authMiddleware` (todos) + `workspaceMiddleware([...roles])` en los que usan `:workspace_id`.

| Método | Ruta | Middleware de ruta | Rol requerido | Finalidad |
|---|---|---|---|---|
| `POST` | `/api/workspace` | `authMiddleware` | autenticado (cualquiera) | Crea un workspace (`name` obligatorio, `description` opcional) y crea automáticamente la membresía del creador con rol **`owner`**. Responde `201`. |
| `GET` | `/api/workspace` | `authMiddleware` | autenticado (cualquiera) | Devuelve todos los workspaces a los que pertenece el usuario autenticado (vía sus membresías). |
| `GET` | `/api/workspace/:workspace_id/members` | `authMiddleware` + `workspaceMiddleware([])` | miembro del workspace | Devuelve la lista de membresías (miembros) del workspace. `[]` = cualquier rol, pero exige ser miembro. |
| `POST` | `/api/workspace/:workspace_id/members/invite` | `authMiddleware` + `workspaceMiddleware(['owner','admin'])` | `owner` / `admin` | Envía por mail una invitación con token (expira en 7 días) a un usuario registrado y verificado. **No crea la membresía**: eso ocurre al aceptar. |
| `GET` | `/api/workspace/:workspace_id/members/invitation` | `authMiddleware` | autenticado con el email invitado | Vista previa de la invitación (`invitation_token` por querystring): quién invitó, workspace y rol. Sin efectos secundarios. |
| `POST` | `/api/workspace/:workspace_id/members/accept-invite` | `authMiddleware` | autenticado con el email invitado | Acepta la invitación (`invitation_token` en el body) y crea la membresía con `invitacion_aceptada: true`. Idempotente. |
| `GET` | `/api/workspace/:workspace_id` | `authMiddleware` + `workspaceMiddleware([])` | miembro del workspace | Devuelve los detalles de un workspace específico. |
| `PUT` | `/api/workspace/:workspace_id` | `authMiddleware` + `workspaceMiddleware(['owner','admin'])` | `owner` / `admin` | Actualiza nombre y/o descripción del workspace. |
| `DELETE` | `/api/workspace/:workspace_id` | `authMiddleware` + `workspaceMiddleware(['owner'])` | solo `owner` | Elimina el workspace. |
| `DELETE` | `/api/workspace/:workspace_id/members/:member_id` | `authMiddleware` + `workspaceMiddleware(['owner','admin'])` | `owner` / `admin` | Elimina (expulsa) un miembro del workspace por ID de membresía. |
| `PUT` | `/api/workspace/:workspace_id/members/:member_id` | `authMiddleware` + `workspaceMiddleware(['owner','admin'])` | `owner` / `admin` | Cambia el rol de un miembro (`admin` o `user`). No permite tocar al `owner` ni que un `admin` modifique a otro `admin`. |

### 5.4 Endpoints planificados (no implementados)

- Mensajes directos (`DirectMessage`) — planificados, aún sin endpoints.

---

## 6. Errores y códigos de estado comunes

| Código | Causa |
|---|---|
| `400` | Body incompleto, email con formato inválido, header `Authorization` ausente o malformado. |
| `401` | Token JWT inválido o expirado. |
| `403` | No es miembro del workspace o el rol no alcanza para la operación. |
| `404` | Recurso (usuario / workspace) no encontrado. |
| `500` | Error inesperado no controlado (registrado por consola por el error handler). |
| `503` | No se pudo conectar a MongoDB (middleware global de conexión). |

---

## 7. Documentación interactiva (Swagger UI)

La API se documenta con **OpenAPI 3.0 + Swagger UI**, generada con `swagger-jsdoc`:

| Recurso | Descripción |
|---|---|
| `/api/docs` | UI interactiva de Swagger: probá cada endpoint con el botón **Authorize** (pegá el `authToken` del login) |
| `/api/docs.json` | Spec OpenAPI cruda en JSON, para consumir desde otras herramientas |

- La definición global (info, servers, esquemas reutilizables, security scheme) vive en `src/docs/openapi.config.js`.
- Cada endpoint está documentado con comentarios `@openapi` junto a su ruta en `src/routes/*.router.js`.
- Incluye: formato de entrada (body, path params, querystring, header Authorization) y **todas las salidas posibles** (200/201 con estructura de `data`, y cada error esperable con su mensaje real).
- El server de producción se toma de la variable de entorno `URL_BACKEND` (si está definida).

---

## 8. Ejemplo de uso

```bash
# 1. Registrarse
POST /api/auth/register
{ "nombre": "Gonza", "email": "gonza@mail.com", "password": "secreto123" }

# 2. Iniciar sesión (obtener token)
POST /api/auth/login
{ "email": "gonza@mail.com", "password": "secreto123" }
# → data.authToken

# 3. Usar el token en los endpoints protegidos
GET /api/workspace
Authorization: Bearer <authToken>
```
