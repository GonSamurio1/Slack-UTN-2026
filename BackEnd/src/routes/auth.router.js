import express from 'express'
import { login, register, verifyEmail, resendVerificationEmail } from '../controllers/auth.controller.js'

const authRouter = express.Router()

/*Validacion del mail del usuario */
authRouter.post('/register', register)

/*Cuando un usaurio inicia sesion debemos crear de alguna forma la sesion */
authRouter.post('/login', login)

authRouter.get('/verify-email', verifyEmail)

/*Reenvio del mail de verificacion para un email registrado y no verificado */
authRouter.get('/verify-email/:email/resend', resendVerificationEmail)

export default authRouter