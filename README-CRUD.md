# UTN Slack — Qué falta para completar el CRUD

Fecha: 20/11/2026
Alcance: **entidad principal `Workspace`** y **entidad relacionada `Member`**, según los requisitos mínimos acordados.
Este documento es de análisis: no se modificó código para escribirlo.

---

## Resumen ejecutivo

El CRUD de `Workspace` está completo **en el backend** (crear, listar, detalle, editar y borrar), pero **en el frontend faltan editar y borrar**. La entidad relacionada `Member` tiene crear, listar y borrar en el backend, pero **falta editar el rol** (y no existe nada en el front para editar ni borrar).

Además se detectó **un error de lógica confirmado** en la validación nueva de `description`: crear un workspace sin descripción devolvía `400` porque el front envía `description: ""` y el backend rechazaba los vacíos. **Corregido el 20/11/2026** (paso 1).

**Bloqueantes para el mínimo:** 1 tarea de backend (B1) + 4 de frontend.
**Recomendado (no bloquea):** 3 mejoras de robustez.

---

## 1. Requisitos mínimos acordados

1. Gestionar una **entidad principal** con CRUD completo → `Workspace`.
2. Gestionar al menos **una entidad relacionada** y modelar la relación → `Member`.
3. **Registro de usuarios**, verificación por correo y login que devuelve **JWT**.
4. **Rutas sensibles protegidas por JWT**.
5. El frontend implementa pantallas para:
   - registro / login,
   - **estado** (listado),
   - **detalle**,
   - **crear / editar / borrar** de la entidad principal,
   - **crear / editar / borrar** de la entidad relacionada.

---

## 2. Estado actual (20/11/2026)

### 2.1 Backend (`BackEnd/`)

| Requisito | Estado | Detalle |
|---|---|---|
| Registro / verificación por email / login con JWT | ✅ | `src/routes/auth.router.js` |
| Rutas protegidas por JWT | ✅ | `authMiddleware` en `/api/user` y `/api/workspace` |
| Workspace — crear | ✅ | `POST /api/workspace` |
| Workspace — listar (estado) | ✅ | `GET /api/workspace` (workspaces del usuario) |
| Workspace — detalle | ✅ | `GET /api/workspace/:workspace_id` |
| Workspace — editar | ✅ | `PUT /api/workspace/:workspace_id` (owner/admin) |
| Workspace — borrar | ✅ | `DELETE /api/workspace/:workspace_id` (owner) + cascada |
| Member — crear | ✅ | `POST /api/workspace/:workspace_id/members` (owner/admin) |
| Member — listar | ✅ | `GET /api/workspace/:workspace_id/members` |
| Member — editar rol | ❌ | **No existe endpoint.** `memberRepository.updateRoleById` existe pero no se usa |
| Member — borrar | ✅ | `DELETE /api/workspace/:workspace_id/members/:member_id` (owner/admin + jerarquía) |

**Relación modelada:** `Member.id_usuario → User` y `Member.espacio_trabajo → Workspace` (ambos `ObjectId` con `ref`).
**Índice único vigente:** `(id_usuario, espacio_trabajo)` — un usuario no puede tener dos membresías en el mismo workspace.

### 2.2 Frontend (`FrontEnd/`)

| Requisito | Estado | Pantalla / componente |
|---|---|---|
| Registro | ✅ | `RegisterScreen` |
| Login | ✅ | `LoginScreen` |
| Verificación / reenvío / reset | ✅ | `VerifyEmailScreen`, `ResendEmailVerificationScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen` |
| Workspace — estado (lista) | ✅ | `HomeScreen` + `WorkspaceList` |
| Workspace — detalle | ✅ | `WorkspaceScreen` (header + sidebar + área principal) |
| Workspace — crear | ✅ | `CreateWorkspaceScreen` (`/workspace/new`) |
| Workspace — editar | ❌ | — |
| Workspace — borrar | ❌ | — |
| Member — crear | ✅ | `AddMember` (email + rol) |
| Member — editar rol | ❌ | — |
| Member — borrar | ❌ | — (el backend ya lo permite) |

---

## 3. Qué falta — Backend

### B1. `PUT /api/workspace/:workspace_id/members/:member_id` (editar rol) 🔴 bloqueante

- **Controlador:** `updateMemberRole` en `src/controllers/workspace.controller.js`.
- **Ruta:** en `src/routes/workspace.router.js`, con `authMiddleware` + `workspaceMiddleware(['owner','admin'])`, siguiendo el estilo del `DELETE` de miembros.
- **Repositorio:** reutilizar `memberRepository.updateRoleById(id, role)` (ya existe, hoy sin uso).
- **Validaciones (jerarquía de roles):**
  1. La membresía debe existir **y pertenecer al workspace de la URL** → `404` (`getByIdAndWorkspace`).
  2. El rol destino solo admite `admin` o `user`; nunca `owner` → `400`.
  3. No se puede modificar al miembro con rol `owner` → `403`.
  4. Un `admin` no puede modificar a otro `admin`; solo el `owner` puede → `403`.
- **Respuesta:** `200 { ok, status, message, data: { member } }`.
- **Documentación:** bloque `@openapi` en el router, como el resto de endpoints.

### B2. Corregir la descripción vacía ✅ corregido (20/11/2026)

Ver error **#1** de la sección 4. `CreateWorkspaceScreen` envía `description: ""` cuando el campo queda vacío, y `validarDescripcionWorkspace` lo rechazaba con `400`. Ahora el backend normaliza `""` a `undefined` (la descripción sigue siendo opcional).

### B3. Robustecer `updateWorkspaceById` ✅ corregido (20/11/2026)

- Si el body no trae `name` ni `description` → `400` ("No hay campos para actualizar") en lugar de `200` sin cambios.
- Si el `update` devuelve `null` (workspace borrado en una carrera) → `404` en lugar de `200` con `workspace: null`.

### B4. Pruebas e2e 🟡 recomendado

Cubrir el endpoint nuevo y los flujos tocados (ver checklist en la sección 7).

### Opcionales (no bloquean el mínimo)

- Índice único **parcial** de `rol: 'owner'` por workspace, para garantizar un solo owner por workspace a nivel DB.
- Mapear `CastError` (ObjectId inválido) a `400` en `src/middlewares/error.middleware.js`; hoy responde `500`.
- Incluir `DirectMessage` en la cascada si en el futuro se habilitan sus endpoints.

---

## 4. Qué falta — Frontend

### F1. Servicios 🔴 bloqueante

Agregar en `FrontEnd/src/services/workspaceService.js`, con el mismo patrón `fetch` + `Authorization: Bearer` + `throw new Error(message)`:

| Función | Endpoint |
|---|---|
| `updateWorkspace(workspace_id, name, description)` | `PUT /api/workspace/:workspace_id` |
| `deleteWorkspace(workspace_id)` | `DELETE /api/workspace/:workspace_id` |
| `updateWorkspaceMember(workspace_id, member_id, rol)` | `PUT /api/workspace/:workspace_id/members/:member_id` |
| `deleteWorkspaceMember(workspace_id, member_id)` | `DELETE /api/workspace/:workspace_id/members/:member_id` |

### F2. Editar workspace 🔴 bloqueante

Recomendado: **`EditWorkspaceScreen`** nueva (molde de `CreateWorkspaceScreen`), ruta `/workspace/:workspace_id/edit` en `App.jsx` dentro de `AuthMiddleware`.

- Precargar `name` y `description` desde `useWorkspace()`.
- Form con `useForm` + `useRequest` + `TextField` / `TextAreaField` / `Button` / `Alert`.
- Al guardar: `updateWorkspace(...)` y volver a `/workspace/:workspace_id` (el `WorkspaceProvider` se re-monta y trae los datos frescos).
- Acceso visible desde el header de `WorkspaceScreen`.

### F3. Borrar workspace 🔴 bloqueante

- Botón en el header de `WorkspaceScreen` (visible solo para `owner`, que es el único rol habilitado en el backend).
- Confirmación explícita (el borrado es en cascada: membresías, canales y mensajes).
- Al confirmar: `deleteWorkspace(...)` → `navigate('/')` → la lista del Home se refresca.

### F4. Acciones de miembros 🔴 bloqueante

En `MemberList` (o un componente `MemberActions` nuevo):

- Saber el rol del usuario logueado: `getAuthUserId()` + buscar su membresía en `members_response.data.listMembers`.
- **Editar rol:** `select` con `Miembro` / `Administrador` → `updateWorkspaceMember(...)` → `reloadWorkspace()`.
- **Borrar:** botón con confirmación → `deleteWorkspaceMember(...)` → `reloadWorkspace()`.
- **Visibilidad según jerarquía (misma regla que el backend):**
  - nadie edita/expulsa al `owner`;
  - un `admin` no edita/expulsa a otro `admin`;
  - un `admin` sí puede editar/expulsar a `user` y editarse a sí mismo solo dentro de lo permitido (evitar autodemoción accidental con confirmación).
- Estados de carga/error por fila y recarga de la lista tras cada acción.

### F5. Verificación 🔴 bloqueante

`npm run build` en `FrontEnd/` + smoke test del dev server + recorrido manual de los flujos.

### Opcionales (no bloquean el mínimo)

- CRUD de canales en el front: el backend ya tiene `PUT` y `DELETE` de canales, pero no hay servicios ni pantallas.
- `AuthMiddleware`: hoy solo chequea que exista el token; conviene chequear expiración y manejar `401` (logout + redirect).

---

## 4.1 Comparación con el prototipo (`referencias/Prototipo.png.png`)

> Nota: este modelo no puede abrir imágenes, así que la comparación se hizo contra la transcripción del prototipo que ya está documentada en `README.md` (sección "Corrección del prototipo") y contra la implementación actual. Si la imagen tiene anotaciones extra, no están reflejadas acá.

| Elemento del prototipo | Implementación actual | Estado |
|---|---|---|
| Ruta `/workspace/:workspace_id` | `WorkspaceScreen` (`App.jsx`) | ✅ |
| `WorkspaceContext` | `FrontEnd/src/Contexts/WorkspaceContext.jsx` | ✅ |
| `useWorkspace` → `GET /api/workspace/:workspace_id` ("nombre del espacio") | Hook + endpoint (devuelve el workspace completo) | ✅ |
| `useChannelsList` → `GET .../channels` | Hook + endpoint | ✅ |
| `useMemberList` → `GET .../members` | Hook + endpoint | ✅ |
| `useChannel` → `GET .../channels/:channel_id` ("datos del canal") | `ChannelContext` + `ChannelScreen` | ✅ |
| `useChannelMessages` → `GET .../messages` | `ChannelContext` + `MessageList` | ✅ |
| `ChannelList` en la columna izquierda | `WorkspaceScreen` → sidebar | ✅ |
| `Channel` + `Messages` en el área principal, **manteniendo el sidebar** | Implementado como **ruta separada** `/workspace/:workspace_id/channel/:channel_id` (`ChannelScreen`); `WorkspaceScreen` muestra un placeholder | ⚠️ Diferencia de layout |
| Botón `Add member` al pie del sidebar | `AddMember` al pie del sidebar | ✅ |

**Lectura de la diferencia:** el prototipo muestra el chat **embebido** dentro de `WorkspaceScreen` (el sidebar de canales/miembros queda visible), mientras que el código navega a una pantalla de canal completa. La funcionalidad está (y de hecho es más completa: enviar/editar/borrar mensajes), pero el layout no es idéntico.

**Sobre el CRUD:** el prototipo **no define** editar/borrar workspace ni editar/borrar miembros. Por lo tanto, los huecos de la sección 4 son requisitos del mínimo, no diferencias contra el prototipo.

**Decisión pendiente sugerida:** para el mínimo, dejar `ChannelScreen` como ruta separada; si se busca fidelidad al prototipo, anidar `ChannelProvider` + `Channel` + `Messages` dentro del área principal de `WorkspaceScreen`. Agregar esta decisión a la tabla de la sección 9 al momento de implementar.

## 5. Patrones del proyecto a respetar

**Backend**
- Capas: `routes → middlewares → controllers → services/repositories → models`.
- Respuesta uniforme: `{ ok, status, message, data }`.
- Errores esperados con `throw new ServerError(mensaje, status)`; el error handler central responde.
- Rutas con path completo en el router (Express 5 no propaga params de `app.use`).
- Documentación `@openapi` junto a cada ruta; schemas reutilizables en `src/docs/openapi.config.js`.
  - Cuidado: un `:` sin comillas en una descripción YAML rompe el parseo de `swagger-jsdoc`.

**Frontend**
- Servicios con `fetch`, `API_URL` desde `VITE_APP_URL_BACKEND` y token desde `localStorage`.
- Hooks `useRequest` (loading/response/error/sendRequest) y `useForm`.
- Cada pantalla/componente en su carpeta con su CSS; datos compartidos vía `WorkspaceContext` / `ChannelContext`.
- Rutas en `App.jsx`; las protegidas dentro de `<AuthMiddleware>`.
- Comentarios en español y campos en `snake_case` (consistente con el resto).

---

## 6. Errores de lógica detectados

| # | Archivo(s) | Qué pasa | Impacto | Fix propuesto |
|---|---|---|---|---|
| 1 | `BackEnd/src/controllers/workspace.controller.js` + `FrontEnd/src/Screens/CreateWorkspaceScreen/CreateWorkspaceScreen.jsx` | El front envía `description: ""`; `validarDescripcionWorkspace` rechaza los vacíos con `400` | **Crear workspace sin descripción falla** (campo que debería ser opcional) | Normalizar `""` → `undefined` en `validarDescripcionWorkspace` (o no enviar el campo si está vacío desde el front). Definir qué hace `""` en un update: ignorar o limpiar. |
| 2 | `BackEnd/src/controllers/workspace.controller.js` (`updateWorkspaceById`) | Body `{}` → `200` sin cambios | Respuesta engañosa | `400` si no hay campos para actualizar |
| 3 | `BackEnd/src/middlewares/error.middleware.js` | `workspace_id` con formato inválido → `CastError` → `500` | Código incorrecto para un error del cliente | Mapear `CastError` a `400`. Ya está documentado como `500` en Swagger, así que hay que actualizar la doc también. |
| 4 | `BackEnd/src/repositories/workspace.repository.js` / controlador | Si `updateById` devuelve `null` (borrado en carrera) → `200` con `workspace: null` | Caso borde | Responder `404` |
| 5 | `FrontEnd/src/Middlewares/AuthMiddleware.jsx` | Solo valida presencia del token, no expiración; no hay manejo global de `401` | Sesión "fantasma": la UI cree estar logueada y los requests fallan | Decodificar `exp` o manejar `401` limpiando el token y redirigiendo a login |
| 6 | `BackEnd/src/controllers/workspace.controller.js` (`addMember`) vs `deleteMemberByRole` | Un `admin` puede **crear** a otro `admin`, pero no puede **expulsarlo** (solo el owner) | Política asimétrica | Decidir: o un admin solo agrega `user`, o un admin también puede expulsar admins. Alinear ambos endpoints. |
| 7 | `BackEnd/src/models/member.model.js` | Nada impide más de un `owner` por workspace a nivel DB (solo se crea uno por lógica) | Riesgo si se inserta directo | Índice único parcial `{ espacio_trabajo: 1 }` con `partialFilterExpression: { rol: 'owner' }` |
| 8 | `BackEnd/src/repositories/workspace.repository.js` (`deleteByIdWithCascade`) | No borra `DirectMessage` | Huérfanos futuros si se habilitan los DM | Incluirlo en la cascada cuando existan endpoints |
| 9 | Varios | Detalles cosméticos: "adminstradores" en el error de `deleteMemberByRole`; método `getAllChannelsByWorkpaceId` (typo) | Sin impacto funcional | Corregir al tocar esos archivos |
| 10 | `FrontEnd/src/hooks/useWorkspaceList.jsx` | N+1: un request de miembros por workspace | Performance | Opcional: que `GET /api/workspace` incluya `members` y `member_count` |

> ✅ Corregidos el 20/11/2026: **#1** (descripción vacía → `undefined`), **#2** (update vacío → `400`), **#4** (update `null` → `404`) y **#9** (typos "administradores" y `getAllChannelsByWorkspaceId`).

---

## 7. Checklist de verificación

### Backend (e2e)

- [ ] `POST /api/workspace` **sin descripción** → `201` (bug #1 corregido).
- [ ] `POST /api/workspace` con nombre vacío / >30 caracteres → `400`.
- [ ] `POST /api/workspace` con descripción >1000 caracteres → `400`.
- [ ] `PUT /api/workspace/:id` con nombre válido → `200` y datos actualizados.
- [ ] `PUT /api/workspace/:id` con body vacío → `400` (B3).
- [ ] `DELETE /api/workspace/:id` → borra workspace, membresías, canales y mensajes.
- [ ] `PUT /api/workspace/:id/members/:member_id`:
  - [ ] owner cambia `user` → `admin` → `200`;
  - [ ] rol destino `owner` → `400`;
  - [ ] target `owner` → `403`;
  - [ ] admin edita a otro admin → `403`;
  - [ ] miembro de otro workspace / id inexistente → `404`;
  - [ ] sin token → `400`; token inválido → `401`; no miembro → `403`.
- [ ] `DELETE .../members/:member_id`: owner `403`; admin borra admin `403`; owner borra admin `200`.

### Frontend

- [ ] `npm run build` OK.
- [ ] Crear workspace con y sin descripción.
- [ ] Editar nombre/descripción y ver el cambio reflejado al volver al detalle.
- [ ] Borrar workspace (como owner) → vuelve al Home y desaparece de la lista.
- [ ] Editar rol de un miembro (como owner y como admin según jerarquía).
- [ ] Borrar miembro con confirmación.
- [ ] Un `user` no ve acciones que no le corresponden.
- [ ] `/api/docs.json` incluye el nuevo `PUT` de miembros.

---

## 8. Plan sugerido (orden de implementación)

1. ~~**B2** (fix descripción) + **B3** (update vacío/404)~~ ✅ hecho (20/11/2026).
2. **B1** (endpoint editar rol) + `@openapi` + e2e.
3. **F1** (servicios).
4. **F2/F3** (editar y borrar workspace).
5. **F4** (acciones de miembros).
6. **F5** (build, smoke y recorrido manual) + actualizar `README.md`, `BackEnd/DOCUMENTACION.md` y este archivo.

---

## 9. Decisiones pendientes para revisar

| Tema | Opción recomendada |
|---|---|
| Editar workspace: pantalla nueva o formulario inline | Pantalla `EditWorkspaceScreen` (reutiliza el molde de creación y es más fácil de probar) |
| Acciones de miembro: inline o modal | Inline en `MemberList` (select de rol + confirmación) para el mínimo |
| ¿Un admin puede agregar admins? | Alinear con la jerarquía de borrado: recomendar que solo el owner agregue admins |
| Descripción vacía en `PUT` | Definir: ignorar (no tocar) o limpiar el campo; recomendado ignorar en el mínimo |
| ¿Incluir CRUD de canales en el front? | Fuera del mínimo; posponer |

---

## 10. Estado del working tree (referencia)

Los cambios de cascada/validaciones/índice único quedaron **commiteados** en `c399d04` ("Eliminacion en cascada de workspaces para que no quede nada huerfano.").

Los cambios de los **pasos 1–3** (20/11/2026) están sin commitear:

- `BackEnd/src/controllers/workspace.controller.js` — descripción vacía → `undefined`, update vacío → `400`, update `null` → `404`, typo corregido.
- `BackEnd/src/repositories/channel.repository.js` — `getAllChannelsByWorkspaceId` (typo corregido).
- `BackEnd/src/repositories/workspace.repository.js` — uso del método renombrado.
- `BackEnd/src/services/channel.services.js` — 3 usos del método renombrado.
- `README-CRUD.md` — nuevo (untracked).
