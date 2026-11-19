import Workspace from "../models/workspace.model.js";
import channelRepository from "./channel.repository.js";
import memberRepository from "./member.repository.js";
import messageChannelRepository from "./message-channel.repository.js";

class WorkspaceRepository {
  // WORKSPACES -->
  async createWorkSpace(nombre, descripcion) {
    const result = await Workspace.create({
      name: nombre,
      description: descripcion
    })
    return result
  }

  async getByID(workspaceId) {
    const result = await Workspace.findById(workspaceId)
    return result
  }

  async deleteById(workspaceId) {
    const result = await Workspace.findByIdAndDelete(workspaceId)
    return result
  }

  // Borrar un workspace y todo lo que depende de él:
  // primero los mensajes de los canales, luego los canales, las membresías
  // y finalmente el workspace (en ese orden, para evitar huérfanos)
  async deleteByIdWithCascade(workspaceId) {
    const channels = await channelRepository.getAllChannelsByWorkpaceId(workspaceId)
    const channelIds = channels.map((channel) => channel._id)

    await messageChannelRepository.deleteManyByChannelIds(channelIds)
    await channelRepository.deleteManyByWorkspaceId(workspaceId)
    await memberRepository.deleteManyByWorkspaceId(workspaceId)

    return await Workspace.findByIdAndDelete(workspaceId)
  }

  async updateById(workspaceId, updateData) {
    const result = await Workspace.findByIdAndUpdate(
      workspaceId,
      updateData,
      { returnDocument: 'after' }
    )
    return result
  }
}

const workspaceRepository = new WorkspaceRepository()
export default workspaceRepository