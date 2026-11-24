# UTN Slack — Plan de trabajo y progreso

Proyecto: clon simplificado de Slack (React + Vite / Express + MongoDB). Fecha: 17/11/2026.

## Estado global: ~80%

### FrontEnd (React + Vite) — ~88%
- ✅ Registro, login, verificación de email (token por link), reenvío, forgot/reset password
- ✅ Rutas protegidas (`AuthMiddleware`), Home con lista de workspaces, crear workspace
- ✅ `WorkspaceContext`, `useWorkspaceList`, `useRequest`, `useForm`, servicios con fetch
- ✅ **2.1 WorkspaceScreen** — header + sidebar de canales/miembros + Add member
- ✅ **2.2 Vista de canal con mensajes** (enviar/editar/borrar propios)
- ✅ **2.3 Crear canal** desde el front
- ✅ **2.4 Logout**
- ✅ **1.3 Add member** desde el sidebar (formulario inline de email + rol)
- ❌ README.md del front, `.env` de producción (entregables)

### BackEnd (Express + MongoDB) — ~85%
- ✅ Arquitectura en capas, bcrypt, JWT con expiración, verificación de email con nodemailer, error middleware, Swagger en `/api/docs`, desplegado en Vercel
- ✅ **1.1 Channels CRUD** (ver abajo)
- ✅ **1.2 Mensajes de canal** (ver abajo)
- ✅ **1.3 Alta de miembros** por email (owner/admin); invitación por mail con token queda fuera de alcance
- ⚠️ Modelos/repos de direct-message listos pero sin endpoints (mensajería directa, fuera de alcance del prototipo)
- ❌ Postman collection (se puede importar `/api/docs.json`)
- ✅ Fixes 1.4: logs con datos personales eliminados y `new: true` reemplazado por `returnDocument: 'after'` en los 5 repositorios
- ⚠️ Pendientes: jerarquía de roles al expulsar, borrado en cascada, validación de workspaces, índice único de membresía

## Corrección del prototipo
- `useWorkspace` → `GET /api/workspace/:workspace_id` (trae el **nombre** del workspace)
- `useMemberList` → `GET /api/workspace/:workspace_id/members` (lista de miembros)
- `useChannelsList` → `GET /api/workspace/:workspace_id/channels`
- `useChannel` → `GET /api/workspace/:workspace_id/channels/:channel_id`
- `useChannelMessages` → `GET /api/workspace/:workspace_id/channels/:channel_id/messages`

## Tareas

### 1. Backend: canales + mensajes + miembros
- [x] 1.1 Channels CRUD — router + controller + service sobre los repos existentes ✅ (17/11/2026, 15/15 pruebas end-to-end pasando)
- [x] 1.2 Messages — listar y enviar mensajes de canal (repos ya existen) ✅ (17/11/2026, 21/21 pruebas e2e OK, incluye permisos de autor/owner con segundo usuario temporal)
- [x] 1.3 Agregar miembro al workspace por email ✅ (19/11/2026, 18/18 pruebas e2e OK)
- [x] 1.4 Fixes: `req.params.userId`, `req.body` undefined, console.logs con datos personales y `new: true` deprecado ✅ (19/11/2026)
- [x] 1.5 Editar rol de miembro: `PUT /api/workspace/:workspace_id/members/:member_id` con jerarquía de roles ✅ (21/11/2026)

### 2. Frontend: WorkspaceScreen + canales (según prototipo)
- [x] 2.1 `WorkspaceScreen`: header con nombre del workspace (`useWorkspace`), `useChannelsList`, `useMemberList`, botón "Add member" ✅ (17/11/2026, build OK + smoke test de módulos)
- [x] 2.2 `ChannelContext` + vista de canal: `useChannel` y `useChannelMessages`, enviar mensajes ✅ (17/11/2026, build + smoke test OK; incluye editar/borrar mensajes propios)
- [x] 2.3 Pantalla de crear canal ✅ (17/11/2026, reutiliza el molde de CreateWorkspaceScreen)
- [x] 2.4 Logout (borrar token + ruta/botón) ✅ (17/11/2026, botón en Home y en el header del workspace)
- [x] 2.5 CRUD de workspaces en el front: editar (`EditWorkspaceScreen`) y borrar (botón con confirmación) ✅ (21/11/2026)

### 3. Entregables obligatorios
- [ ] 3.1 README.md en Front y Back con documentación de endpoints (backend ya tiene `DOCUMENTACION.md`)
- [ ] 3.2 Postman collection (base: import de `/api/docs.json`)
- [ ] 3.3 `.env` de producción en Vercel (front apuntando a URL del back), prueba end-to-end

## Registro técnico: CRUD mínimo de workspaces y miembros (hecho)

- **Backend:** `PUT /api/workspace/:workspace_id/members/:member_id` (`updateMemberRole`) con `authMiddleware` + `workspaceMiddleware(['owner','admin'])`. Valida rol destino (`admin`/`user`), que la membresía exista en el workspace, que no sea el `owner` y que un `admin` no modifique a otro `admin`. `updateRoleById` ahora filtra por `_id` y workspace. Bloque `@openapi` agregado (el path expone `delete` + `put`).
- **Frontend servicios:** `updateWorkspace`, `deleteWorkspace`, `updateWorkspaceMember` y `deleteWorkspaceMember` en `workspaceService.js`.
- **Frontend pantallas:** `EditWorkspaceScreen` (`/workspace/:workspace_id/edit`) y `DeleteWorkspace` en el header de `WorkspaceScreen`; link "Editar espacio" visible para owner/admin, botón de borrar solo para owner.
- **Acciones de miembro:** en `MemberList`, select de rol y botón de expulsión con confirmación, visibles según la jerarquía del backend (owner/admin → `user`; el owner no se toca).

## Registro técnico: 1.4 Fixes (hecho)

- **Logs con datos personales eliminados:** `workspace.middleware.js` (ya no loguea membresía ni `req.user` en cada request), `member.repository.js` (lista de miembros), `user.repository.js` (6 logs de documentos de usuario) y `bcrypt.util.js` (resultado de la comparación de contraseñas).
- **`error.middleware.js`:** ahora registra solo `error.message` y el stack con `console.error`, no el objeto completo.
- **Mongoose 9:** `new: true` reemplazado por `returnDocument: 'after'` en `channel`, `member`, `message-channel`, `workspace` y `direct-message` repositories.
- Se conservan únicamente los logs operativos de arranque y conexión (`main.js`, `mongo.config.js`).

Verificado: sin `console.log` de PII ni `new: true` en `BackEnd/src` (grep), sintaxis OK en los 9 archivos y e2e de 1.3 **18/18 OK** con el log del servidor limpio (solo arranque, DNS y conexión a Mongo).

## Registro técnico: 1.3 Alta de miembros por invitación (hecho)

Se reemplazó el alta directa por **invitación por mail con aceptación**. La membresía **no** se crea al invitar: se crea recién cuando la persona invitada acepta desde `/accept-invite`. La invitación es un JWT firmado que expira a los 7 días y no se guarda nada en la base hasta la aceptación, así que un invitado pendiente nunca aparece como miembro ni obtiene acceso al workspace.

Endpoints nuevos:
- `POST /api/workspace/:workspace_id/members/invite` — (owner/admin) body `{ email, rol }`. Valida email, usuario existente y verificado, que no sea ya miembro y el rol (`admin`/`user`). Envía el mail con el link y responde `200`. **No crea la membresía.**
- `GET /api/workspace/:workspace_id/members/invitation?invitation_token=...` — (autenticado con el email invitado) vista previa: quién invitó, workspace y rol. Sin efectos secundarios.
- `POST /api/workspace/:workspace_id/members/accept-invite` — (autenticado con el email invitado) body `{ invitation_token }`. Crea la membresía con `invitacion_aceptada: true`. Es idempotente: si ya es miembro responde `200` con `already_member: true`.

Archivos:
- `src/controllers/workspace.controller.js` — `inviteMember`, `getInvitationPreview`, `acceptInvite`
- `src/routes/workspace.router.js` — rutas + bloques `@openapi`
- `src/utils/email-templates/workspace-invite.template.js` (nuevo)
- `member.repository.js` y modelo `Member` — sin cambios (el campo `invitacion_aceptada` sigue existiendo y se guarda en `true`)

Front:
- `src/services/workspaceService.js` — `inviteWorkspaceMember`, `getWorkspaceInvitation`, `acceptWorkspaceInvite`
- `src/Components/AddMember/` — ahora invita ("Enviar invitacion") y avisa que se envió el mail; no recarga la lista de miembros
- `src/Screens/AcceptInviteScreen/` (nuevo) — muestra quién te invitó y a qué workspace, con botones "Aceptar invitacion" / "Ahora no"
- `src/Middlewares/AuthMiddleware.jsx` — guarda el destino en `?redirect=` para volver después del login
- `src/Screens/LoginScreen/LoginScreen.jsx` — navega al `redirect` (validando que sea una ruta interna)
- `src/App.jsx` — ruta protegida `/accept-invite`

Verificado: e2e contra la API real (13/13 OK): preview OK, otro email 403, token expirado 400, token de otro tipo 400, accept 201, accept idempotente 200, preview `already_member`, usuario inexistente 404, rol `owner` 400, ya miembro 400, sin permisos 403 y lista incluye al invitado; usuarios/workspace temporales borrados al final. `npm run build` OK (83 módulos) y OpenAPI expone las 3 rutas nuevas sin warnings.

## Registro técnico: 2.3 Crear canal + 2.4 Logout (hecho)

**2.3 — Crear canal:**
- `src/services/channelService.js` — `createChannel(workspace_id, name, description)` (POST `.../channels`)
- `src/Screens/CreateChannelScreen/` (nuevo) — molde idéntico a CreateWorkspaceScreen: `useForm` + `useRequest` + TextField/TextAreaField/Button/Alert; descripción con `maxLength` 200 (límite del backend); al crear, redirige de vuelta a `/workspace/:workspace_id` (el WorkspaceProvider se re-monta y la lista de canales sale fresca)
- Ruta `/workspace/:workspace_id/channel/new` en App.jsx (declarada antes de `:channel_id`; además el segmento estático `new` tiene prioridad sobre el param)
- `ChannelList` — link "+ Crear canal" al pie (mismo patrón que "Crear espacio de trabajo" del Home)

**2.4 — Logout:**
- `src/Components/LogoutButton/` (nuevo) — `localStorage.removeItem('auth_token')` + `navigate('/login')`. El `AuthMiddleware` de las rutas protegidas hace el resto (sin token redirige al login)
- Ubicado en la fila de tabs del HomeScreen (a la derecha) y en el header del WorkspaceScreen (`.workspace-screen__header-info` ahora es `flex: 1` para empujarlo a la derecha)

Verificado: `npm run build` OK (75 módulos) + smoke test del dev server (los 7 módulos nuevos/afectados transforman sin error).

## Registro técnico: 2.2 Vista de canal con mensajes (hecho)

Pantalla tipo chat que reemplazó el placeholder de `ChannelScreen`.

Archivos:
- `src/Contexts/ChannelContext.jsx` (nuevo) — provider en la ruta `/workspace/:workspace_id/channel/:channel_id`; expone `useChannel` (→ `GET .../channels/:channel_id`) y `useChannelMessages` (→ `.../messages`), más `reloadChannel`/`reloadChannelMessages`. Mismo patrón que WorkspaceContext.
- `src/services/channelService.js` — 5 funciones nuevas: `getChannelById`, `getChannelMessages`, `createChannelMessage`, `updateChannelMessage`, `deleteChannelMessage`
- `src/utils/currentUser.js` (nuevo) — `getAuthUserId()` / `getAuthUserName()`: decodifica el payload del JWT de localStorage (sin verificar firma, eso lo hace el backend). Sirve para marcar como "propios" los mensajes del usuario logueado
- `src/Components/MessageList/` (nuevo) — lista de mensajes con avatar + nombre + hora + contenido, "(editado)" si aplica, "(vos)" en los propios; auto-scroll al último mensaje; Editar con textarea inline (PUT) y Eliminar con confirm (DELETE) solo en mensajes propios; estados de carga/error/empty
- `src/Screens/ChannelScreen/` — reescrita: header con `# nombre` y descripción, área de mensajes scrolleable y barra de envío abajo (`POST` + `useEffect` sobre la respuesta para limpiar el input y recargar la lista, mismo patrón que el LoginScreen)
- Ruta `/workspace/:workspace_id/channel/:channel_id` ya existía del 2.1 (App.jsx no cambió)

Detalles:
- El envío recarga la lista completa (refetch) en vez de insertar el mensaje a mano: garantiza orden y emisor poblado correctos
- Permisos visuales: editar/borrar solo se muestran en mensajes propios (el backend además permite borrar a owner/admin; el front no lo muestra por ahora porque necesitaría saber el rol del usuario en el workspace)
- `maxLength={2000}` en inputs, igual al límite del backend

Verificado: `npm run build` OK (71 módulos) + smoke test del dev server (los 6 módulos nuevos transforman sin error).

## Registro técnico: 2.1 WorkspaceScreen (hecho)

Layout según el prototipo (`referencias/Prototipo.png.png`): header del workspace arriba, sidebar con ChannelList + MemberList + "Add member", área principal para la vista del canal.

Archivos:
- `src/Contexts/WorkspaceContext.jsx` — ahora también consulta la lista de canales y expone 3 hooks con los nombres del prototipo: `useWorkspace` (→ `GET /api/workspace/:workspace_id`), `useChannelsList` (→ `.../channels`) y `useMemberList` (→ `.../members`). Un solo provider, tres vistas de los mismos datos (reutilización de `useRequest`).
- `src/services/channelService.js` (nuevo) — `getChannels(workspace_id)`, mismo patrón fetch que workspaceService
- `src/Components/ChannelList/` (nuevo) — lista `# nombre`, links a `/workspace/:workspace_id/channel/:channel_id`, estados de carga/error/empty (mismo patrón que WorkspaceList)
- `src/Components/MemberList/` (nuevo) — avatares con inicial y color (misma paleta que WorkspaceList), nombre, email implícito y rol traducido (Propietario/Administrador/Miembro)
- `src/Screens/WorkspaceScreen/` — reescrita: header (nombre + descripción + volver al inicio), sidebar, área principal placeholder "Selecciona un canal", responsive (sidebar arriba en <768px)
- `src/Components/Form/Button.jsx` — agregado prop `onClick` (compatible con el uso actual)
- `src/Screens/ChannelScreen/` — **placeholder del paso 2.2** (ruta `/workspace/:workspace_id/channel/:channel_id` ya agregada en App.jsx; reemplazar ese archivo cuando se haga la vista de mensajes)
- Botón "Add member": muestra un aviso informativo; se conecta al endpoint del 1.3 cuando esté listo

Verificado: `npm run build` OK (67 módulos) + smoke test del dev server (home 200, los 7 módulos nuevos transforman sin error).

## Registro técnico: 1.2 Mensajes de canal (hecho)

Endpoints nuevos (JWT + `workspaceMiddleware`; todos validan que el canal exista y pertenezca al workspace):
- `POST /api/workspace/:workspace_id/channels/:channel_id/messages` — enviar mensaje (cualquier miembro). 400 si contenido vacío o >2000 caracteres
- `GET /api/workspace/:workspace_id/channels/:channel_id/messages` — listar mensajes ordenados por fecha (asc), con `populate` del emisor (nombre + email) → para el futuro `useChannelMessages`
- `PUT .../messages/:message_id` — editar (solo el **autor**; marca `editado: true`)
- `DELETE .../messages/:message_id` — eliminar (el **autor**, o **owner/admin** del workspace)

Archivos:
- `src/services/message-channel.services.js` (nuevo) — reutiliza `getChannelById` del 1.1 para validar el canal
- `src/controllers/message-channel.controller.js` (nuevo)
- `src/routes/channel.router.js` — 4 rutas nuevas con `@openapi` (mismo tag `Channels`)
- `src/repositories/message-channel.repository.js` — agregado `getMessageById(messageId, channel_id)`; la lista ahora ordena por `fecha_creacion` ascendente
- `src/docs/openapi.config.js` — esquemas `ChannelMessage` y `ChannelMessageWithEmisor`

Nota Swagger/YAML: las descripciones de la doc no pueden contener `:` sin comillas (rompe el parseo de swagger-jsdoc). Si pasa, el servidor arranca igual pero la spec queda incompleta — fijarse en el warning "Not all input has been taken into account".

Verificado con pruebas end-to-end (con segundo usuario temporal para probar permisos, todo borrado al final): 21/21 OK (crear, validaciones 400, canal inexistente 404, listar con populate y orden, editar propio, editar ajeno 403, borrar ajeno 403, owner borra mensaje ajeno 200, sin membresía 403, id inválido 500, limpieza).

## Registro técnico: 1.1 Channels CRUD (hecho)

Endpoints nuevos (todos requieren JWT; `workspaceMiddleware` valida membresía):
- `POST /api/workspace/:workspace_id/channels` — crear canal (cualquier miembro). 400 si falta nombre, descripción >200 o nombre repetido en el workspace
- `GET /api/workspace/:workspace_id/channels` — listar canales (cualquier miembro)
- `GET /api/workspace/:workspace_id/channels/:channel_id` — detalle (404 si no existe o no pertenece al workspace)
- `PUT /api/workspace/:workspace_id/channels/:channel_id` — actualizar (owner/admin)
- `DELETE /api/workspace/:workspace_id/channels/:channel_id` — eliminar (owner/admin)

Archivos:
- `src/services/channel.services.js` (nuevo) — validaciones: nombre obligatorio, descripción ≤200, nombre único por workspace (case-insensitive), canal debe pertenecer al workspace de la URL
- `src/controllers/channel.controller.js` (nuevo)
- `src/routes/channel.router.js` (nuevo) — con comentarios `@openapi` (aparece en `/api/docs`, tag `Channels`)
- `src/repositories/channel.repository.js` — agregado `getChannelById(channelId, workspace_id)`
- `src/main.js` — montaje en `/api/workspace`
- `src/docs/openapi.config.js` — tag `Channels` + esquema `Channel`

Nota Express 5: los params del path de montaje (`app.use('/api/workspace/:workspace_id/channels', ...)`) **no se propagan** al `req.params` del sub-router. Por eso el router declara las rutas con el path completo (`/:workspace_id/channels`) montado sobre `/api/workspace`, igual que el resto.

Verificado con pruebas end-to-end contra la API real (con workspace temporal creado y borrado): 15/15 OK (crear, duplicado, sin nombre, descripción larga, listar, detalle, actualizar, inexistente 404, id inválido 500, borrar, re-borrar 404, limpieza).

Hagamos esto. Crea un nuevo readme, donde anotes que es lo que falta para completar el CRUD a la perfeccion, siguiendo los mismos patrones del proyecto. Luego de ahi me fijo bien que puede cambiar, etc. Fijate tambien si hay algun error de logica. En resumen un readme que diga que es lo que falta para terminar con el CRUD con los requisitos minimos teniendo en cuenta ya el avance del proyecto como esta ahora. Al final decido conservar los cambios sin commitear ya que los entendi. 