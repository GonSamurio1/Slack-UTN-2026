import DirectMessage from "../models/direct-message.model.js";

class DirectMessageRepository {

  async createDirectMessage(contenido, emisor_id, receptor_id) {
    const result = await DirectMessage.create({
      contenido,
      emisor_id,
      receptor_id
    });
    return result;
  }

  async deleteById(messageId) {
    const result = await DirectMessage.findByIdAndDelete(messageId);
    return result;
  }

  async updateById(messageId, contenido) {
    const result = await DirectMessage.findByIdAndUpdate(
      messageId,
      { contenido },
      { new: true }
    );
    return result;
  }

  async getMessagesBetweenUsers(emisor_id, receptor_id) {
    const result = await DirectMessage.find({
      $or: [
        { emisor_id: emisor_id, receptor_id: receptor_id },
        { emisor_id: receptor_id, receptor_id: emisor_id }
      ]
    })
      .sort({ fecha_creacion: 1 }) // Ordena cronológicamente (del más viejo al más nuevo)
      .populate('emisor_id', 'nombre email')
      .populate('receptor_id', 'nombre email');

    return result;
  }

  async getAllMessagesBySearchTerm(searchTerm) {
    const result = await DirectMessage.find({
      contenido: { $regex: searchTerm, $options: 'i' }
    });
    return result;
  }

  async getAllMessagesByDateRange(minDate, maxDate) {
    const result = await DirectMessage.find({
      fecha_creacion: {
        $gte: new Date(minDate),
        $lt: new Date(maxDate)
      }
    });
    return result;
  }
}

const directMessageRepository = new DirectMessageRepository();
export default directMessageRepository