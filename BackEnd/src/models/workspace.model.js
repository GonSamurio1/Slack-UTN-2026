import mongoose from "mongoose";
const workSpaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 30,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    fecha_creacion: {
      type: Date,
      default: Date.now,
    },
  }
)

export const WORKSPACE_COLLECTION_NAME = 'Workspace'
const WorkSpace = mongoose.model(WORKSPACE_COLLECTION_NAME, workSpaceSchema)
export default WorkSpace;