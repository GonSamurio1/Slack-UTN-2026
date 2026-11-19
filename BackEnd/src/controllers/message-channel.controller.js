import {
  createMessage,
  getMessagesList,
  updateMessageById,
  deleteMessageById
} from "../services/message-channel.services.js";

// Enviar un mensaje a un canal -->
export async function createMessageController(req, res) {
  const { workspace_id, channel_id } = req.params;
  const body = req.body || {};

  const messageCreated = await createMessage(workspace_id, channel_id, req.user, body);

  return res.status(201).json({
    ok: true,
    status: 201,
    message: "Mensaje enviado con éxito",
    data: {
      message: messageCreated
    }
  });
}

// Obtener los mensajes de un canal -->
export async function getMessagesListController(req, res) {
  const { workspace_id, channel_id } = req.params;

  const messagesList = await getMessagesList(workspace_id, channel_id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Lista de mensajes del canal obtenida con éxito",
    data: {
      messagesList
    }
  });
}

// Actualizar un mensaje por ID -->
export async function updateMessageByIdController(req, res) {
  const { workspace_id, channel_id, message_id } = req.params;
  const body = req.body || {};

  const messageActualizado = await updateMessageById(workspace_id, channel_id, message_id, req.user, body);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Mensaje actualizado correctamente",
    data: {
      message: messageActualizado
    }
  });
}

// Eliminar un mensaje por ID -->
export async function deleteMessageByIdController(req, res) {
  const { workspace_id, channel_id, message_id } = req.params;

  const messageDeleted = await deleteMessageById(workspace_id, channel_id, message_id, req.user, req.membership);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Mensaje eliminado",
    data: {
      messageDeleted
    }
  });
}
