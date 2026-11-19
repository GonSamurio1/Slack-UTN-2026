import messageChannelRepository from "../repositories/message-channel.repository.js";
import { getChannelById } from "./channel.services.js";
import ServerError from "../utils/error.util.js";

/*
Logica de negocio de los mensajes de canal (la capa repository se encarga del acceso a BD).

Validaciones y permisos:
- El contenido es obligatorio (se recortan los espacios de los bordes) y no supera los 2000 caracteres
- El canal debe existir y pertenecer al workspace de la URL (getChannelById del service de canales)
- El mensaje debe existir y pertenecer al canal de la URL
- Editar: solo el autor del mensaje
- Eliminar: el autor del mensaje, o owner/admin del workspace
*/

const CONTENT_MAX_LENGTH = 2000;

// Validar y normalizar el contenido del mensaje -->
function validarContenido(contenido) {
  if (contenido === undefined || contenido === null || String(contenido).trim() === '') {
    throw new ServerError('El contenido del mensaje es obligatorio', 400);
  }

  const contenidoNormalizado = String(contenido).trim();

  if (contenidoNormalizado.length > CONTENT_MAX_LENGTH) {
    throw new ServerError(`El mensaje no puede superar los ${CONTENT_MAX_LENGTH} caracteres`, 400);
  }

  return contenidoNormalizado;
}

// Enviar un mensaje a un canal (el emisor es el usuario autenticado) -->
export async function createMessage(workspace_id, channel_id, user, datos) {
  const contenido = validarContenido(datos.contenido);

  // El canal debe existir y pertenecer al workspace (lanza 404 si no) -->
  const channel = await getChannelById(workspace_id, channel_id);

  const messageCreated = await messageChannelRepository.createMessageChannel(contenido, channel._id, user.id);

  return messageCreated;
}

// Obtener los mensajes de un canal (con nombre y email del emisor, ordenados por fecha) -->
export async function getMessagesList(workspace_id, channel_id) {
  // El canal debe existir y pertenecer al workspace (lanza 404 si no) -->
  const channel = await getChannelById(workspace_id, channel_id);

  const messagesList = await messageChannelRepository.getAllMessagesByChannelId(channel._id);

  return messagesList;
}

// Actualizar un mensaje (solo el autor) -->
export async function updateMessageById(workspace_id, channel_id, message_id, user, datos) {
  const contenido = validarContenido(datos.contenido);

  // El canal debe existir y pertenecer al workspace (lanza 404 si no) -->
  const channel = await getChannelById(workspace_id, channel_id);

  // El mensaje debe existir y pertenecer al canal (lanza 404 si no) -->
  const message = await getMessage(channel._id, message_id);

  // Solo el autor puede editar su mensaje -->
  if (String(message.emisor_id._id ?? message.emisor_id) !== String(user.id)) {
    throw new ServerError('Solo podes editar tus propios mensajes', 403);
  }

  const messageActualizado = await messageChannelRepository.updateById(message._id, contenido);

  return messageActualizado;
}

// Eliminar un mensaje (el autor, o owner/admin del workspace) -->
export async function deleteMessageById(workspace_id, channel_id, message_id, user, membership) {
  // El canal debe existir y pertenecer al workspace (lanza 404 si no) -->
  const channel = await getChannelById(workspace_id, channel_id);

  // El mensaje debe existir y pertenecer al canal (lanza 404 si no) -->
  const message = await getMessage(channel._id, message_id);

  const esAutor = String(message.emisor_id._id ?? message.emisor_id) === String(user.id);
  const esOwnerOAdmin = membership.rol === 'owner' || membership.rol === 'admin';

  if (!esAutor && !esOwnerOAdmin) {
    throw new ServerError('Solo podes eliminar tus propios mensajes', 403);
  }

  const messageDeleted = await messageChannelRepository.deleteById(message._id);

  return messageDeleted;
}

// Obtener un mensaje por ID validando que pertenezca al canal -->
async function getMessage(channel_id, message_id) {
  const message = await messageChannelRepository.getMessageById(message_id, channel_id);

  if (!message) {
    throw new ServerError('Mensaje no encontrado', 404);
  }

  return message;
}
