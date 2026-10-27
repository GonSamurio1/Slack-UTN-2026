import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./users.model.js"

const directMessageSchema = new mongoose.Schema(
  {
    contenido: {
      type: String,
      required: true
    },

    emisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: USER_COLLECTION_NAME
    },

    receptor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: USER_COLLECTION_NAME
    },

    fecha_creacion: {
      type: Date,
      default: Date.now
    }
  }
)

export const DIRECT_MESSAGE_COLLECTION_NAME = 'DirectMessage'
const DirectMessage = mongoose.model(DIRECT_MESSAGE_COLLECTION_NAME, directMessageSchema)
export default DirectMessage