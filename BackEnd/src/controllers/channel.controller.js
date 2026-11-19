import {
  createChannel,
  getChannelsList,
  getChannelById,
  updateChannelById,
  deleteChannelById
} from "../services/channel.services.js";

// Crear un canal dentro de un workspace -->
export async function createChannelController(req, res) {
  const { workspace_id } = req.params;
  const body = req.body || {};

  const channelCreated = await createChannel(workspace_id, body);

  return res.status(201).json({
    ok: true,
    status: 201,
    message: "Canal creado con éxito",
    data: {
      channel: channelCreated
    }
  });
}

// Obtener la lista de canales de un workspace -->
export async function getChannelsListController(req, res) {
  const { workspace_id } = req.params;

  const channelsList = await getChannelsList(workspace_id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Lista de canales obtenida con éxito",
    data: {
      channelsList
    }
  });
}

// Obtener un canal especifico por ID -->
export async function getChannelByIdController(req, res) {
  const { workspace_id, channel_id } = req.params;

  const channel = await getChannelById(workspace_id, channel_id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Detalles del canal obtenidos con éxito",
    data: {
      channel
    }
  });
}

// Actualizar un canal por ID -->
export async function updateChannelByIdController(req, res) {
  const { workspace_id, channel_id } = req.params;
  const body = req.body || {};

  const channelActualizado = await updateChannelById(workspace_id, channel_id, body);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Canal actualizado correctamente",
    data: {
      channel: channelActualizado
    }
  });
}

// Eliminar un canal por ID -->
export async function deleteChannelByIdController(req, res) {
  const { workspace_id, channel_id } = req.params;

  const channelDeleted = await deleteChannelById(workspace_id, channel_id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Canal eliminado",
    data: {
      channelDeleted
    }
  });
}
