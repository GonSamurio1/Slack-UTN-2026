// Trabajar la conexion
import mongoose from "mongoose";
import ENVIROMMENT from "./enviromment.config.js";

console.log(ENVIROMMENT)
async function connectMongoDB() {
  try {
    await mongoose.connect(
      `${ENVIROMMENT.MONGO_DB_URI}/${ENVIROMMENT.MONGO_DB_NAME}`
    )
    console.log('Conexion a MongoDB exitosa...')

  } catch (error) {
    console.error('Error critico al intentar conexion', error.message)

    // CRASHEO CONTROLADO -->
    process.exit(1)
  }
}

export default connectMongoDB