import mongoose from "mongoose";
import { WORKSPACE_COLLECTION_NAME } from "./workspace.model.js";

const channelSchema = new mongoose.Schema
  (
    {
      workspace_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: WORKSPACE_COLLECTION_NAME
      },

      nombre: {
        type: String,
        required: true
      },

      descripcion: {
        type: String,
        maxlength: 200
      },

      fecha_creacion: {
        type: Date,
        default: Date.now
      }

    }
  )

export const CHANNEL_COLLECTION_NAME = 'Canal'
const Channel = mongoose.model(CHANNEL_COLLECTION_NAME, channelSchema)
export default Channel