import express from 'express'

// Import funciones de controllers -->
import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspaceById, deleteWorkspaceById, deleteMemberByRole, updateMemberRole, workspaceMemberesList, addMember, inviteMember, getInvitationPreview, acceptInvite } from '../controllers/workspace.controller.js'

// Import Middlewares -->
import authMiddleware from '../middlewares/auth.middleware.js'
import workspaceMiddleware from '../middlewares/workspace.middleware.js'

const workspaceRouter = express.Router()

// Errores comunes a los endpoints con :workspace_id (auth + workspaceMiddleware) -->
/*
  400: header Authorization ausente o sin token
  401: token JWT inválido o expirado
  403: no es miembro ('No pertences a este espacio de trabajo') o rol insuficiente ('No tenes permisos suficientes para hacer esta operacion')
  404: workspace no existe ('Workspace no encontrado')
  500: error inesperado (incluye workspace_id con formato inválido → error de cast de Mongo)
  503: no se pudo conectar a MongoDB
*/

// Crear Workspace (Cualquier user autenticado) -->

/**
 * @openapi
 * /api/workspace:
 *   post:
 *     tags: [Workspaces]
 *     summary: Crea un workspace
 *     description: |
 *       Crea un workspace y registra automáticamente la membresía del creador con rol **owner**.
 *       Requiere token JWT (cualquier usuario autenticado).
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 30
 *                 example: Equipo Backend
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Workspace del equipo de backend
 *     responses:
 *       201:
 *         description: Workspace creado con su membresía owner
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       example: 201
 *                     message:
 *                       example: 'Espacio de trabajo creado con éxito'
 *                     data:
 *                       $ref: '#/components/schemas/CreatedWorkspaceData'
 *       400:
 *         description: Header Authorization ausente/sin token, o falta el nombre del workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               NombreFaltante:
 *                 value: { ok: false, status: 400, message: 'El nombre del espacio de trabajo es obligatorio' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.post('/', authMiddleware, createWorkspace);

/**
 * @openapi
 * /api/workspace:
 *   get:
 *     tags: [Workspaces]
 *     summary: Lista los workspaces del usuario autenticado
 *     description: |
 *       Devuelve todos los workspaces a los que pertenece el usuario autenticado
 *       (vía sus membresías, cada item combina la membresía con datos del workspace).
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de workspaces del usuario obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Lista de espacios de trabajo del usuario obtenida con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspaces:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/UserWorkspaceItem'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.get('/', authMiddleware, getUserWorkspaces);

/**
 * @openapi
 * /api/workspace/{workspace_id}/members:
 *   post:
 *     tags: [Workspaces]
 *     summary: Agrega un miembro existente al workspace
 *     description: |
 *       Agrega al workspace un usuario ya registrado, identificado por su email.
 *       La membresia queda activa al instante (no hay invitacion por mail).
 *       Solo **owner** y **admin**. Los roles permitidos son `admin` y `user`.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'companero@mail.com'
 *               rol:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *                 example: user
 *     responses:
 *       201:
 *         description: Miembro agregado correctamente (devuelve la membresia creada)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Miembro agregado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         member:
 *                           $ref: '#/components/schemas/Member'
 *       400:
 *         description: Header Authorization ausente, email faltante o invalido, rol invalido, o el usuario ya es miembro
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               EmailFaltante:
 *                 value: { ok: false, status: 400, message: 'El email del usuario es obligatorio' }
 *               EmailInvalido:
 *                 value: { ok: false, status: 400, message: 'El email no tiene un formato valido' }
 *               RolInvalido:
 *                 value: { ok: false, status: 400, message: 'Rol invalido para ejecutar esta accion' }
 *               YaEsMiembro:
 *                 value: { ok: false, status: 400, message: 'El usuario ya pertenece a este espacio de trabajo' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, o su rol no alcanza (se requiere owner o admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *       404:
 *         description: Workspace no encontrado, o no existe un usuario con ese email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceInexistente:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               UsuarioInexistente:
 *                 value: { ok: false, status: 404, message: 'Usuario no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id con formato invalido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.post('/:workspace_id/members', authMiddleware, workspaceMiddleware(['owner', 'admin']), addMember)

/**
 * @openapi
 * /api/workspace/{workspace_id}/members/invite:
 *   post:
 *     tags: [Workspaces]
 *     summary: Invita por email a un usuario existente
 *     description: |
 *       Envia un mail con un link para aceptar la invitacion. La membresia **no** se crea
 *       en este paso: se crea recien cuando la persona invitada acepta (ver
 *       `POST /members/accept-invite`). El token expira a los 7 dias.
 *       Solo **owner** y **admin**. Los roles permitidos son `admin` y `user`.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'companero@mail.com'
 *               rol:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *                 example: user
 *     responses:
 *       200:
 *         description: Invitacion enviada (no crea la membresia)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Invitacion enviada a companero@mail.com'
 *                     data:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                         rol:
 *                           type: string
 *                           enum: [admin, user]
 *       400:
 *         description: Email faltante o invalido, rol invalido, usuario sin verificar, o el usuario ya es miembro
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               EmailFaltante:
 *                 value: { ok: false, status: 400, message: 'El email del usuario es obligatorio' }
 *               EmailInvalido:
 *                 value: { ok: false, status: 400, message: 'El email no tiene un formato valido' }
 *               RolInvalido:
 *                 value: { ok: false, status: 400, message: 'Rol invalido para ejecutar esta accion' }
 *               EmailNoVerificado:
 *                 value: { ok: false, status: 400, message: 'El usuario todavía no verificó su email' }
 *               YaEsMiembro:
 *                 value: { ok: false, status: 400, message: 'El usuario ya pertenece a este espacio de trabajo' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, o su rol no alcanza (se requiere owner o admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *       404:
 *         description: Workspace no encontrado, o no existe un usuario con ese email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceInexistente:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               UsuarioInexistente:
 *                 value: { ok: false, status: 404, message: 'Usuario no encontrado' }
 *       500:
 *         description: Error inesperado (incluye fallo de envio de mail o workspace_id invalido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.post('/:workspace_id/members/invite', authMiddleware, workspaceMiddleware(['owner', 'admin']), inviteMember)

/**
 * @openapi
 * /api/workspace/{workspace_id}/members/invitation:
 *   get:
 *     tags: [Workspaces]
 *     summary: Vista previa de una invitacion
 *     description: |
 *       Devuelve quien invito, a que workspace y con que rol, para que la pantalla de
 *       aceptacion lo muestre antes de confirmar. No tiene efectos secundarios.
 *       Requiere estar logueado con el email invitado.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: query
 *         name: invitation_token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitacion valida
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspace:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                         invited_by:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                         invited_email:
 *                           type: string
 *                           format: email
 *                         rol:
 *                           type: string
 *                           enum: [admin, user]
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                         already_member:
 *                           type: boolean
 *       400:
 *         description: Token ausente, invalido o expirado; o no corresponde a este workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'La invitacion es obligatoria' }
 *               TokenInvalido:
 *                 value: { ok: false, status: 400, message: 'La invitacion es invalida o expiro' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: La sesion iniciada no es la del email invitado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 403, message: 'Esta invitacion fue enviada a otro email' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.get('/:workspace_id/members/invitation', authMiddleware, getInvitationPreview)

/**
 * @openapi
 * /api/workspace/{workspace_id}/members/accept-invite:
 *   post:
 *     tags: [Workspaces]
 *     summary: Acepta una invitacion y crea la membresia
 *     description: |
 *       Valida el token de la invitacion y crea la membresia con `invitacion_aceptada: true`.
 *       Requiere estar logueado con el email invitado. Es idempotente: si ya es miembro
 *       responde 200 con `already_member: true`.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitation_token]
 *             properties:
 *               invitation_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ya era miembro (idempotente)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         already_member:
 *                           type: boolean
 *                           example: true
 *       201:
 *         description: Membresia creada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Te uniste a Equipo Backend'
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspace:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                         member:
 *                           $ref: '#/components/schemas/Member'
 *                         already_member:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Token ausente, invalido o expirado; rol invalido; o email sin verificar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               TokenInvalido:
 *                 value: { ok: false, status: 400, message: 'La invitacion es invalida o expiro' }
 *               RolInvalido:
 *                 value: { ok: false, status: 400, message: 'La invitacion tiene un rol invalido' }
 *               EmailNoVerificado:
 *                 value: { ok: false, status: 400, message: 'El usuario todavía no verificó su email' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: La sesion iniciada no es la del email invitado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 403, message: 'Esta invitacion fue enviada a otro email' }
 *       404:
 *         description: Workspace o usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceInexistente:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               UsuarioInexistente:
 *                 value: { ok: false, status: 404, message: 'Usuario no encontrado' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.post('/:workspace_id/members/accept-invite', authMiddleware, acceptInvite)

/**
 * @openapi
 * /api/workspace/{workspace_id}/members:
 *   get:
 *     tags: [Workspaces]
 *     summary: Lista los miembros de un workspace
 *     description: |
 *       Devuelve la lista de membresías del workspace, con los datos del usuario de cada
 *       miembro poblados (nombre y email). Requiere ser miembro del workspace (cualquier rol).
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     responses:
 *       200:
 *         description: Lista de miembros obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Lista de miembros de un workspace obtenida correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         listMembers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/MemberWithUser'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: El usuario no es miembro del workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.get('/:workspace_id/members', authMiddleware, workspaceMiddleware([]), workspaceMemberesList)

/**
 * @openapi
 * /api/workspace/{workspace_id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Detalles de un workspace
 *     description: Devuelve los detalles de un workspace específico. Requiere ser miembro (cualquier rol).
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     responses:
 *       200:
 *         description: Detalles del workspace obtenidos con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Detalles del espacio de trabajo obtenidos con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspace:
 *                           $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: El usuario no es miembro del workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.get('/:workspace_id', authMiddleware, workspaceMiddleware([]), getWorkspaceById);

/**
 * @openapi
 * /api/workspace/{workspace_id}:
 *   put:
 *     tags: [Workspaces]
 *     summary: Actualiza un workspace
 *     description: |
 *       Actualiza el nombre y/o la descripción de un workspace.
 *       Solo **owner** y **admin**.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 30
 *                 example: Equipo Backend v2
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Nueva descripción del workspace
 *     responses:
 *       200:
 *         description: Workspace actualizado correctamente (devuelve la versión actualizada)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Espacio de trabajo actualizado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspace:
 *                           $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, o su rol no alcanza (se requiere owner o admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.put('/:workspace_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), updateWorkspaceById,);

/**
 * @openapi
 * /api/workspace/{workspace_id}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Elimina un workspace
 *     description: |
 *       Elimina el workspace y devuelve el documento eliminado.
 *       Solo **owner**.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *     responses:
 *       200:
 *         description: Workspace eliminado (devuelve el documento eliminado)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Espacio de trabajo eliminado'
 *                     data:
 *                       type: object
 *                       properties:
 *                         workspaceDelete:
 *                           $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, o su rol no alcanza (se requiere owner)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.delete('/:workspace_id', authMiddleware, workspaceMiddleware(['owner']), deleteWorkspaceById);

/**
 * @openapi
 * /api/workspace/{workspace_id}/members/{member_id}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Expulsa un miembro del workspace
 *     description: |
 *       Elimina una membresía por su ID (busca por `_id` de membresía y workspace).
 *       Solo **owner** y **admin**.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la membresía (no del usuario)
 *         example: '665f1c9e2f4a3b0012345680'
 *     responses:
 *       200:
 *         description: Miembro eliminado correctamente (devuelve la membresía eliminada)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Miembro eliminado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         memberDeletd:
 *                           $ref: '#/components/schemas/Member'
 *       400:
 *         description: Header Authorization ausente o sin token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, o su rol no alcanza (se requiere owner o admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *       404:
 *         description: Workspace no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id o member_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.delete('/:workspace_id/members/:member_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), deleteMemberByRole)

/**
 * @openapi
 * /api/workspace/{workspace_id}/members/{member_id}:
 *   put:
 *     tags: [Workspaces]
 *     summary: Cambia el rol de un miembro del workspace
 *     description: |
 *       Actualiza el rol de una membresía (busca por `_id` de membresía y workspace).
 *       Solo **owner** y **admin**.
 *
 *       Reglas de jerarquía:
 *       - El rol destino solo puede ser `admin` o `user` (nunca `owner`).
 *       - No se puede modificar al `owner` del workspace.
 *       - Un `admin` no puede modificar a otro `admin`; solo el `owner` puede.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la membresía (no del usuario)
 *         example: '665f1c9e2f4a3b0012345680'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, user]
 *           example: { rol: 'admin' }
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente (devuelve la membresía actualizada)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Rol del miembro actualizado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         member:
 *                           $ref: '#/components/schemas/Member'
 *       400:
 *         description: Header Authorization ausente/sin token, o rol inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               TokenAusente:
 *                 value: { ok: false, status: 400, message: 'Auth token is required' }
 *               RolInvalido:
 *                 value: { ok: false, status: 400, message: 'Rol invalido para ejecutar esta accion' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro, rol insuficiente, target owner o admin modificando admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               RolInsuficiente:
 *                 value: { ok: false, status: 403, message: 'No tenes permisos suficientes para hacer esta operacion' }
 *               TargetOwner:
 *                 value: { ok: false, status: 403, message: 'No se puede modificar el rol del propietario del espacio de trabajo' }
 *               AdminSobreAdmin:
 *                 value: { ok: false, status: 403, message: 'Solo el propietario del espacio de trabajo puede modificar administradores' }
 *       404:
 *         description: Workspace o miembro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               MiembroNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Miembro no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye workspace_id o member_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
workspaceRouter.put('/:workspace_id/members/:member_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), updateMemberRole)

// Alta directa de miembros: POST /:workspace_id/members (ver arriba).
// Invitacion por mail: POST /:workspace_id/members/invite, vista previa en
// GET /:workspace_id/members/invitation y aceptacion en
// POST /:workspace_id/members/accept-invite.

// Los canales del workspace viven en channel.router.js (main.js los monta sobre /api/workspace)

export default workspaceRouter
