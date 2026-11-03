import dns from "node:dns";
import mongoose from "mongoose";
import ENVIROMMENT from "./enviromment.config.js";

const dnsServers = dns.getServers();
const usaSoloLoopback = dnsServers.length === 0 || dnsServers.every(
  (server) => server === "127.0.0.1" || server === "::1"
);

// Workaround local: en algunas redes Node queda apuntando a 127.0.0.1 y no
// puede resolver los SRV de MongoDB Atlas. En Vercel/produccion no se aplica.
if (!process.env.VERCEL && process.env.NODE_ENV !== "production" && usaSoloLoopback) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  console.warn("[DNS] Node estaba usando loopback; usando 8.8.8.8/1.1.1.1 para desarrollo.");
}

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