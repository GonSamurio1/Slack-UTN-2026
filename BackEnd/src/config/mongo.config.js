import mongoose from "mongoose";
import ENVIROMMENT from "./enviromment.config.js";

async function connectMongoDB() {
  // Si ya estamos conectados (readyState 1), no volvemos a conectar
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    // Si tu MONGO_DB_URI ya incluye el nombre de la DB o viene de Atlas:
    // Es más seguro concatenar así o pasar dbName en las opciones
    await mongoose.connect(ENVIROMMENT.MONGO_DB_URI, {
      dbName: ENVIROMMENT.MONGO_DB_NAME,
      serverSelectionTimeoutMS: 5000 // 5 segundos máximo para intentar conectar
    });
    console.log('Conexion a MongoDB exitosa...');
  } catch (error) {
    console.error('Error critico al intentar conexion:', error.message);
    throw error; // Relanzamos el error para que lo capture el middleware
  }
}

export default connectMongoDB;