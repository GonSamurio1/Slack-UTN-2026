import express from 'express';
import cors from 'cors';

import connectMongoDB from "./config/mongo.config.js";

// MIDDELWARES -->
import errorHandlerMiddleware from "./middlewares/error.middleware.js";

// ROUTES -->
import authRouter from "./routes/auth.router.js";
import workspaceRouter from "./routes/workspace.router.js";
import userRouter from "./routes/user.router.js";
import ENVIROMMENT from './config/enviromment.config.js';

const app = express();

app.use(cors());
app.use(express.json());

// Middleware para asegurar conexión antes de resolver cualquier endpoint
app.use(async (req, res, next) => {
  try {
    await connectMongoDB();
    next();
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    res.status(503).json({
      message: "No se pudo conectar a la base de datos",
      error: error.message
    });
  }
});

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/workspace', workspaceRouter);

app.use(errorHandlerMiddleware);

// Para desarrollo local se ejecuta el app.listen
if (process.env.NODE_ENV !== 'production') {
  const PORT = ENVIROMMENT.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor local escuchando en http://localhost:${PORT}`);
  });
}

// Requerido para Vercel Serverless Functions
export default app;