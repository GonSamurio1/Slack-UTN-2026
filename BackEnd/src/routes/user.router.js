import express from 'express'
import { getUserById, getUsers } from '../controllers/user.controller.js'


const userRouter = express.Router()

userRouter.get('/', getUsers)
userRouter.get('/:userId', getUserById)

export default userRouter