import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      //Nunca traemos el hash en las queries por defecto. Para leerlo (solo login)
      //hay que pedirlo explicitamente con .select('+password')
      select: false
    },
    fecha_creacion: {
      type: Date,
      default: Date.now,
    },
    activo: {
      type: Boolean,
      default: true
    },

    emailVerificado: {
      type: Boolean,
      default: false

    },
  }
)

export const USER_COLLECTION_NAME = 'Usuario'
const User = mongoose.model(USER_COLLECTION_NAME, userSchema)
export default User