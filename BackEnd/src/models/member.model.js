import mongoose from "mongoose";
import { USER_COLLECTION_NAME } from "./users.model.js";
import { WORKSPACE_COLLECTION_NAME } from "./workspace.model.js"

const memberSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: USER_COLLECTION_NAME

    },
    espacio_trabajo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: WORKSPACE_COLLECTION_NAME
    },
    rol: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user'
    },
    fecha_creacion: {
      type: Date,
      default: Date.now
    },
    invitacion_aceptada: {
      type: Boolean,
      default: false
    }
  }
)

// Un usuario no puede tener dos membresías activas en el mismo workspace
memberSchema.index({ id_usuario: 1, espacio_trabajo: 1 }, { unique: true })

export const MEMBER_COLLECTION_NAME = 'Miembro'
const Member = mongoose.model(MEMBER_COLLECTION_NAME, memberSchema)
export default Member