import Channel from "../models/channel.model.js";
class ChannelRepository {

  async createChannel(nombre, descripcion, workspace_id) {
    const result = await Channel.create(
      {
        nombre,
        descripcion,
        workspace_id
      }
    )
    return result
  }

  async deleteById(channelId) {
    const result = await Channel.findByIdAndDelete(channelId)
    return result
  }

  async updateById(channelId, nombre, descripcion) {
    const result = await Channel.findByIdAndUpdate(channelId, { nombre, descripcion }, { new: true })
    return result
  }

  async getAllChannelsByWorkpaceId(workspace_id) {
    const result = await Channel.find({ workspace_id })
    return result
  }
}

const channelRepository = new ChannelRepository()
export default channelRepository