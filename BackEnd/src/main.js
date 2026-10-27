import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

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
import ENVIROMMENT from './config/enviromment.config.js';

const PORT = ENVIROMMENT.PORT
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
