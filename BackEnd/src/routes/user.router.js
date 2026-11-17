import express from 'express'
import { getUserById, getUsers } from '../controllers/user.controller.js'

// Import Middlewares -->
import authMiddleware from '../middlewares/auth.middleware.js'


const userRouter = express.Router()

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Lista todos los usuarios registrados
 *     description: Devuelve el listado completo de usuarios registrados. Requiere token JWT válido.
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Listado de usuarios obtenido con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Get users list'
 *                     data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
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
userRouter.get('/', authMiddleware, getUsers)

/**
 * @openapi
 * /api/user/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Detalles de un usuario por ID
 *     description: Devuelve los detalles de un usuario específico. Requiere token JWT válido.
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: '665f1c9e2f4a3b0012345678'
 *     responses:
 *       200:
 *         description: Detalles del usuario obtenidos con éxito
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Get user details successfully'
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
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
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'User not found' }
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
userRouter.get('/:userId', authMiddleware, getUserById)

export default userRouter
