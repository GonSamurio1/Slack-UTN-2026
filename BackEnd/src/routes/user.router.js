import express from 'express'
import { getUserById, getUsers } from '../controllers/user.controller.js'

// Import Middlewares -->
import authMiddleware from '../middlewares/auth.middleware.js'


const userRouter = express.Router()

userRouter.get('/', authMiddleware, getUsers)
userRouter.get('/:userId', authMiddleware, getUserById)

export default userRouter