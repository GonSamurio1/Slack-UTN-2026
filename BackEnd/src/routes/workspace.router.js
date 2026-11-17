import express from 'express'

// Import funciones de controllers -->
import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspaceById, deleteWorkspaceById, deleteMemberByRole, workspaceMemberesList } from '../controllers/workspace.controller.js'

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

// Enviar invitacion a un nuevo miembro (todavia no se llego ahi) -->
//workspaceRouter('/:worksapce_id/members/invite')

// Aceptar invitacion (todavia no se llego ahi) -->
//workspaceRouter('/:workspace_id/members/accept-invite/:invitation_token')

export default workspaceRouter
