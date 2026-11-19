import express from 'express'

// Import funciones de controllers -->
import {
  createChannelController,
  getChannelsListController,
  getChannelByIdController,
  updateChannelByIdController,
  deleteChannelByIdController
} from '../controllers/channel.controller.js'

// Import funciones de controllers de mensajes de canal -->
import {
  createMessageController,
  getMessagesListController,
  updateMessageByIdController,
  deleteMessageByIdController
} from '../controllers/message-channel.controller.js'

// Import Middlewares -->
import authMiddleware from '../middlewares/auth.middleware.js'
import workspaceMiddleware from '../middlewares/workspace.middleware.js'

const channelRouter = express.Router()

/*
Este router se monta en main.js sobre /api/workspace (igual que workspace.router.js),
por eso las rutas se declaran con el path completo /:workspace_id/channels.
(No se anida con router.use porque en Express 5 los params del path de montaje
no se propagan al sub-router: req.params llegaria sin workspace_id.)

Errores comunes a los endpoints (auth + workspaceMiddleware) -->
  400: header Authorization ausente o sin token / nombre o descripcion invalidos
  401: token JWT invalido o expirado
  403: no es miembro ('No pertences a este espacio de trabajo') o rol insuficiente ('No tenes permisos suficientes para hacer esta operacion')
  404: workspace no existe ('Workspace no encontrado') / canal no existe ('Canal no encontrado')
  500: error inesperado (incluye channel_id con formato invalido -> error de cast de Mongo)
  503: no se pudo conectar a MongoDB
*/

// Crear canal (cualquier miembro del workspace) -->

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels:
 *   post:
 *     tags: [Channels]
 *     summary: Crea un canal dentro de un workspace
 *     description: |
 *       Crea un canal en el workspace indicado. El nombre no puede repetirse
 *       dentro del mismo workspace (comparación sin distinguir mayúsculas).
 *       Requiere ser miembro del workspace (cualquier rol).
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: general
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Canal para charlas generales del equipo
 *     responses:
 *       201:
 *         description: Canal creado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Canal creado con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         channel:
 *                           $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Header Authorization ausente/sin token, nombre ausente, descripción de más de 200 caracteres o nombre repetido en el workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               NombreFaltante:
 *                 value: { ok: false, status: 400, message: 'El nombre del canal es obligatorio' }
 *               DescripcionLarga:
 *                 value: { ok: false, status: 400, message: 'La descripcion del canal no puede superar los 200 caracteres' }
 *               NombreRepetido:
 *                 value: { ok: false, status: 400, message: 'Ya existe un canal con ese nombre en este espacio de trabajo' }
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
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.post('/:workspace_id/channels', authMiddleware, workspaceMiddleware([]), createChannelController)

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels:
 *   get:
 *     tags: [Channels]
 *     summary: Lista los canales de un workspace
 *     description: |
 *       Devuelve todos los canales del workspace indicado.
 *       Requiere ser miembro del workspace (cualquier rol).
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
 *         description: Lista de canales obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Lista de canales obtenida con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         channelsList:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Channel'
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
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.get('/:workspace_id/channels', authMiddleware, workspaceMiddleware([]), getChannelsListController)

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}:
 *   get:
 *     tags: [Channels]
 *     summary: Detalles de un canal
 *     description: |
 *       Devuelve los detalles de un canal específico (valida que pertenezca al workspace).
 *       Requiere ser miembro del workspace (cualquier rol).
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *     responses:
 *       200:
 *         description: Detalles del canal obtenidos con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Detalles del canal obtenidos con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         channel:
 *                           $ref: '#/components/schemas/Channel'
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
 *         description: Workspace no encontrado, o el canal no existe / no pertenece a ese workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.get('/:workspace_id/channels/:channel_id', authMiddleware, workspaceMiddleware([]), getChannelByIdController)

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}:
 *   put:
 *     tags: [Channels]
 *     summary: Actualiza un canal
 *     description: |
 *       Actualiza el nombre y/o la descripción de un canal.
 *       Solo **owner** y **admin** del workspace.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: general-v2
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: Nueva descripción del canal
 *     responses:
 *       200:
 *         description: Canal actualizado correctamente (devuelve la versión actualizada)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Canal actualizado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         channel:
 *                           $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Header Authorization ausente/sin token, nombre ausente, descripción de más de 200 caracteres o nombre repetido en el workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               NombreFaltante:
 *                 value: { ok: false, status: 400, message: 'El nombre del canal es obligatorio' }
 *               NombreRepetido:
 *                 value: { ok: false, status: 400, message: 'Ya existe un canal con ese nombre en este espacio de trabajo' }
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
 *         description: Workspace no encontrado, o el canal no existe / no pertenece a ese workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.put('/:workspace_id/channels/:channel_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), updateChannelByIdController)

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}:
 *   delete:
 *     tags: [Channels]
 *     summary: Elimina un canal
 *     description: |
 *       Elimina el canal (valida que exista y pertenezca al workspace) y devuelve el documento eliminado.
 *       Solo **owner** y **admin** del workspace.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *     responses:
 *       200:
 *         description: Canal eliminado (devuelve el documento eliminado)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Canal eliminado'
 *                     data:
 *                       type: object
 *                       properties:
 *                         channelDeleted:
 *                           $ref: '#/components/schemas/Channel'
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
 *         description: Workspace no encontrado, o el canal no existe / no pertenece a ese workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.delete('/:workspace_id/channels/:channel_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), deleteChannelByIdController)

// ==================== Mensajes de un canal ====================

// Enviar mensaje a un canal (cualquier miembro del workspace) -->

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}/messages:
 *   post:
 *     tags: [Channels]
 *     summary: Envia un mensaje a un canal
 *     description: |
 *       Crea un mensaje en el canal indicado. El emisor es el usuario autenticado.
 *       Requiere ser miembro del workspace (cualquier rol).
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Hola equipo, bienvenidos al canal
 *     responses:
 *       201:
 *         description: Mensaje enviado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Mensaje enviado con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           $ref: '#/components/schemas/ChannelMessage'
 *       400:
 *         description: Header Authorization ausente/sin token, contenido ausente o de más de 2000 caracteres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               ContenidoFaltante:
 *                 value: { ok: false, status: 400, message: 'El contenido del mensaje es obligatorio' }
 *               ContenidoLargo:
 *                 value: { ok: false, status: 400, message: 'El mensaje no puede superar los 2000 caracteres' }
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
 *         description: Workspace no encontrado, o el canal no existe / no pertenece a ese workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id o message_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.post('/:workspace_id/channels/:channel_id/messages', authMiddleware, workspaceMiddleware([]), createMessageController)

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}/messages:
 *   get:
 *     tags: [Channels]
 *     summary: Lista los mensajes de un canal
 *     description: |
 *       Devuelve los mensajes del canal ordenados por fecha de creación (más viejos primero),
 *       con el nombre y email del emisor poblados.
 *       Requiere ser miembro del workspace (cualquier rol).
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *     responses:
 *       200:
 *         description: Lista de mensajes obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Lista de mensajes del canal obtenida con éxito'
 *                     data:
 *                       type: object
 *                       properties:
 *                         messagesList:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ChannelMessageWithEmisor'
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
 *         description: Workspace no encontrado, o el canal no existe / no pertenece a ese workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.get('/:workspace_id/channels/:channel_id/messages', authMiddleware, workspaceMiddleware([]), getMessagesListController)

// Actualizar mensaje (solo el autor) -->

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}/messages/{message_id}:
 *   put:
 *     tags: [Channels]
 *     summary: Actualiza un mensaje
 *     description: |
 *       Edita el contenido de un mensaje y lo marca como editado.
 *       Solo el **autor** del mensaje.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345682'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Mensaje editado
 *     responses:
 *       200:
 *         description: 'Mensaje actualizado correctamente (devuelve la versión actualizada, con editado: true)'
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Mensaje actualizado correctamente'
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           $ref: '#/components/schemas/ChannelMessage'
 *       400:
 *         description: Header Authorization ausente/sin token, contenido ausente o de más de 2000 caracteres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               HeaderAusente:
 *                 value: { ok: false, status: 400, message: 'Auth header is required' }
 *               ContenidoFaltante:
 *                 value: { ok: false, status: 400, message: 'El contenido del mensaje es obligatorio' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: No es miembro del workspace, o no es el autor del mensaje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               NoEsAutor:
 *                 value: { ok: false, status: 403, message: 'Solo podes editar tus propios mensajes' }
 *       404:
 *         description: Workspace/canal no encontrado, o el mensaje no existe / no pertenece a ese canal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *               MensajeNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Mensaje no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id o message_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.put('/:workspace_id/channels/:channel_id/messages/:message_id', authMiddleware, workspaceMiddleware([]), updateMessageByIdController)

// Eliminar mensaje (el autor, o owner/admin del workspace) -->

/**
 * @openapi
 * /api/workspace/{workspace_id}/channels/{channel_id}/messages/{message_id}:
 *   delete:
 *     tags: [Channels]
 *     summary: Elimina un mensaje
 *     description: |
 *       Elimina el mensaje y devuelve el documento eliminado.
 *       Puede hacerlo el **autor** del mensaje, o un **owner/admin** del workspace.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: workspace_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345679'
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345681'
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345682'
 *     responses:
 *       200:
 *         description: Mensaje eliminado (devuelve el documento eliminado)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Mensaje eliminado'
 *                     data:
 *                       type: object
 *                       properties:
 *                         messageDeleted:
 *                           $ref: '#/components/schemas/ChannelMessage'
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
 *         description: No es miembro del workspace, o no es el autor ni owner/admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               NoMiembro:
 *                 value: { ok: false, status: 403, message: 'No pertences a este espacio de trabajo' }
 *               SinPermisos:
 *                 value: { ok: false, status: 403, message: 'Solo podes eliminar tus propios mensajes' }
 *       404:
 *         description: Workspace/canal no encontrado, o el mensaje no existe / no pertenece a ese canal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               WorkspaceNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Workspace no encontrado' }
 *               CanalNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Canal no encontrado' }
 *               MensajeNoEncontrado:
 *                 value: { ok: false, status: 404, message: 'Mensaje no encontrado' }
 *       500:
 *         description: Error inesperado. Incluye channel_id o message_id con formato inválido (error de cast de Mongo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
channelRouter.delete('/:workspace_id/channels/:channel_id/messages/:message_id', authMiddleware, workspaceMiddleware([]), deleteMessageByIdController)

export default channelRouter
