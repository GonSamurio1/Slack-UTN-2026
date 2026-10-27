import express from 'express'
import { login, register, verifyEmail } from '../controllers/auth.controller.js'

const authRouter = express.Router()

/*Validacion del mail del usuario */
authRouter.post('/register', register)

/*Cuando un usaurio inicia sesion debemos crear de alguna forma la sesion */
authRouter.post('/login', login)

authRouter.get('/verify-email/:verifyEmailToken', verifyEmail)

export default authRouter