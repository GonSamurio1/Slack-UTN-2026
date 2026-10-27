import express from 'express'
import cors from 'cors'

import connectMongoDB from "./config/mongo.config.js";

connectMongoDB()

// MIDDELWARES -->
import errorHandlerMiddleware from "./middlewares/error.middleware.js";

// ROUTES -->
import authRouter from "./routes/auth.router.js";
import workspaceRouter from "./routes/workspace.router.js"
import userRouter from "./routes/user.router.js";

const PORT = 8080
const app = express()

app.use(cors())
app.use(express.json())

// Derivamos a un router en especifico dependiendo la req que nos llegue -->
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/workspace', workspaceRouter)

app.use(
  errorHandlerMiddleware
)

app.listen(
  PORT,
  () => {
    console.log(
      `El servidor se esta escuchando correctamente en http://localhost:${PORT}`
    )
  }
)
