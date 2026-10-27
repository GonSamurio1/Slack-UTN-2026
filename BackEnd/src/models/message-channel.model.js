import mongoose from "mongoose";
import { CHANNEL_COLLECTION_NAME } from "./channel.model.js";
import { USER_COLLECTION_NAME } from "./users.model.js";

const channelMessageSchema = new mongoose.Schema
  (
    {
      contenido: {
        type: String,
        required: true
      },

      channel_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: CHANNEL_COLLECTION_NAME
      },

      emisor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: USER_COLLECTION_NAME
      },

      fecha_creacion: {
        type: Date,
        default: Date.now
      },

      editado: {
        type: Boolean,
        default: false
      }
    }
  )

export const MESSAGE_CHANNEL_COLLECTION_NAME = 'MessageChannel';
const MessageChannel = mongoose.model(MESSAGE_CHANNEL_COLLECTION_NAME, channelMessageSchema);
export default MessageChannel;