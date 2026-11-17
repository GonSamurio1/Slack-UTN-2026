import express from 'express'
import { login, register, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/auth.controller.js'

const authRouter = express.Router()

/*Validacion del mail del usuario */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un usuario y envía el mail de verificación
 *     description: |
 *       Valida nombre, email (formato) y password, hashea la contraseña y envía un mail
 *       con el link de verificación (token de 24h).
 *
 *       Respuesta ambigua a propósito (anti *user enumeration*): si el email ya existe y
 *       aún no está verificado se reenvía el mail; si ya está verificado no se hace nada.
 *       En todos los casos la respuesta del endpoint es idéntica.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Gonza
 *               email:
 *                 type: string
 *                 format: email
 *                 example: gonza@mail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secreto123
 *     responses:
 *       201:
 *         description: Usuario registrado (o mail de verificación reenviado). Cuerpo sin data.
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
 *                       example: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
 *       400:
 *         description: Faltan campos o el email tiene formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               CamposFaltantes:
 *                 value: { ok: false, status: 400, message: 'Email, password and nombre is required' }
 *               EmailInvalido:
 *                 value: { ok: false, status: 400, message: 'Email is incorrect' }
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
authRouter.post('/register', register)

/*Cuando un usaurio inicia sesion debemos crear de alguna forma la sesion */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión y devuelve el token JWT de la sesión
 *     description: |
 *       Verifica las credenciales (bcrypt) y que la cuenta esté verificada.
 *       Devuelve un **JWT de sesión** en `data.authToken` (payload: `id`, `name`, `email`;
 *       vence a los 7 días) que se usará en el header `Authorization: Bearer <token>`
 *       del resto de endpoints.
 *
 *       El mensaje de credenciales inválidas es el mismo si el email no existe o si la
 *       password es incorrecta (anti *user enumeration*).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: gonza@mail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secreto123
 *     responses:
 *       200:
 *         description: Autenticación exitosa, devuelve el token de sesión
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'User authenticated succesfully'
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokenData'
 *       400:
 *         description: Faltan campos, email con formato inválido o credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               CamposFaltantes:
 *                 value: { ok: false, status: 400, message: 'email and password are required' }
 *               EmailInvalido:
 *                 value: { ok: false, status: 400, message: 'Email is incorrect' }
 *               CredencialesInvalidas:
 *                 description: Email inexistente o password incorrecta (mismo mensaje en ambos casos)
 *                 value: { ok: false, status: 400, message: 'Invalid credentials' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Cuenta pendiente de verificación por email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 403, message: 'Email not verified' }
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
authRouter.post('/login', login)

/**
 * @openapi
 * /api/auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verifica la cuenta desde el link del mail
 *     description: |
 *       Recibe el token de verificación por **querystring** (el que llega en el link del mail,
 *       vence a las 24h) y marca la cuenta como verificada.
 *
 *       Nota: si el token es inválido o está expirado, `jwt.verify` lanza un error sin `status`
 *       y el error handler responde `500 Internal server error` (comportamiento actual).
 *     parameters:
 *       - in: query
 *         name: verification_token
 *         required: true
 *         schema:
 *           type: string
 *         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Cuenta verificada con éxito. Cuerpo sin data.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'User registred succesfully'
 *       400:
 *         description: Falta el token o la cuenta ya estaba verificada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               TokenFaltante:
 *                 value: { ok: false, status: 400, message: 'Verification token is required' }
 *               CuentaYaVerificada:
 *                 value: { ok: false, status: 400, message: 'Account is already verified' }
 *       404:
 *         description: El usuario del token no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 404, message: 'User not found' }
 *       500:
 *         description: Error inesperado. Incluye el caso de token de verificación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 500, message: 'Internal server error' }
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
authRouter.get('/verify-email', verifyEmail)

/*Reenvio del mail de verificacion para un email registrado y no verificado.
  POST con email por body (operacion con efectos secundarios, no debe ser GET) */

/**
 * @openapi
 * /api/auth/resend-verification-email:
 *   post:
 *     tags: [Auth]
 *     summary: Reenvía el mail de verificación
 *     description: |
 *       Reenvía el mail de verificación a un email registrado y aún no verificado.
 *       Es `POST` por ser una operación con efectos secundarios.
 *
 *       Respuesta ambigua (anti *user enumeration*): solo reenvía si la cuenta existe y está
 *       pendiente de verificación; en cualquier otro caso la respuesta es idéntica.
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
 *                 example: gonza@mail.com
 *     responses:
 *       200:
 *         description: Mail de verificación (re)enviado si correspondía. Cuerpo sin data.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
 *       400:
 *         description: Falta el email o tiene formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example: { ok: false, status: 400, message: 'Email is incorrect' }
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
authRouter.post('/resend-verification-email', resendVerificationEmail)

/*Solicitud de restablecimiento de contraseña: envia un mail con el token si la cuenta existe */

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicita el restablecimiento de contraseña
 *     description: |
 *       Envía un mail con un token de restablecimiento (vence a la 1h) si la cuenta existe.
 *
 *       Respuesta ambigua (anti *user enumeration*): no revela si el email está registrado;
 *       la respuesta es idéntica exista o no la cuenta.
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
 *                 example: gonza@mail.com
 *     responses:
 *       200:
 *         description: Mail con el token enviado si la cuenta existía. Cuerpo sin data.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Se enviará un mail con los pasos para restablecer tu contraseña, en caso de que esta sea real'
 *       400:
 *         description: Falta el email o tiene formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               EmailFaltante:
 *                 value: { ok: false, status: 400, message: 'Email is required' }
 *               EmailInvalido:
 *                 value: { ok: false, status: 400, message: 'Email is incorrect' }
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable503'
 */
authRouter.post('/forgot-password', forgotPassword)

/*Restablecimiento de contraseña: valida el token recibido por mail y guarda la nueva password */

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablece la contraseña con el token del mail
 *     description: |
 *       Valida el `reset_token` recibido por mail (querystring del link, vence a la 1h)
 *       y guarda la nueva password (hasheada).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reset_token, password]
 *             properties:
 *               reset_token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: nuevaClave123
 *     responses:
 *       200:
 *         description: Contraseña restablecida. Cuerpo sin data.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Envelope'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: 'Password restablecida con exito. Ya podes iniciar sesion con tu nueva contraseña'
 *       400:
 *         description: Faltan campos o el token es inválido/expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               CamposFaltantes:
 *                 value: { ok: false, status: 400, message: 'Reset token and password are required' }
 *               TokenInvalido:
 *                 value: { ok: false, status: 400, message: 'Reset token is invalid or expired' }
 *       404:
 *         description: El usuario del token no existe
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
authRouter.post('/reset-password', resetPassword)

export default authRouter
