import MessageChannel from "../models/message-channel.model.js";

class MessageChannelRepository {
  async createMessageChannel(contenido, channel_id, emisor_id) {
    const result = await MessageChannel.create
      (
        {
          contenido,
          channel_id,
          emisor_id
        }
      )

    return result
  }

  async deleteById(messageId) {
    const result = await MessageChannel.findByIdAndDelete(messageId)
    return result
  }

  async updateById(messageId, contenido) {
    const result = await MessageChannel.findByIdAndUpdate(messageId, { contenido }, { new: true })
    return result
  }

  async getAllMessagesByChannelId(channel_id) {
    const result = await MessageChannel.find({ channel_id })
      .populate(
        'emisor_id',
        'nombre email'
      )
    return result
  }

  async getAllMessagesBySearchTerm(searchTerm) {
    const result = await MessageChannel.find({ contenido: { $regex: searchTerm, $options: 'i' } })
    return result
  }

  async getAllMessagesByDateRange(minDate, maxDate) {
    const result = await MessageChannel.find({
      fecha_creacion: {
        $gte: new Date(minDate),
        $lt: new Date(maxDate)
      }
    })
    return result
  }
}

const messageChannelRepository = new MessageChannelRepository()
export default messageChannelRepository