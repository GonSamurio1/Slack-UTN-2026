import express from 'express'
import { login, register, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from '../controllers/auth.controller.js'

const authRouter = express.Router()

/*Validacion del mail del usuario */
authRouter.post('/register', register)

/*Cuando un usaurio inicia sesion debemos crear de alguna forma la sesion */
authRouter.post('/login', login)

authRouter.get('/verify-email', verifyEmail)

/*Reenvio del mail de verificacion para un email registrado y no verificado */
authRouter.get('/verify-email/:email/resend', resendVerificationEmail)

/*Solicitud de restablecimiento de contraseña: envia un mail con el token si la cuenta existe */
authRouter.post('/forgot-password', forgotPassword)

/*Restablecimiento de contraseña: valida el token recibido por mail y guarda la nueva password */
authRouter.post('/reset-password', resetPassword)

export default authRouter