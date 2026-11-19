import channelRepository from "../repositories/channel.repository.js";
import ServerError from "../utils/error.util.js";

/*
Logica de negocio de canales (la capa repository se encarga del acceso a BD).

Validaciones:
- El nombre es obligatorio (se recorta espacios de los bordes)
- La descripcion no puede superar los 200 caracteres (maxlength del modelo)
- No pueden existir dos canales con el mismo nombre dentro del mismo workspace
  (comparacion case-insensitive)
- Al crear/editar, el canal debe pertenecer al workspace de la URL
  (evita manipular canales de otro workspace enviando su _id)
*/

const DESCRIPTION_MAX_LENGTH = 200;

// Validar y normalizar nombre + descripcion (devuelve { nombre, descripcion }) -->
function validarDatos(nombre, descripcion) {
  if (nombre === undefined || nombre === null || String(nombre).trim() === '') {
    throw new ServerError('El nombre del canal es obligatorio', 400);
  }

  const nombreNormalizado = String(nombre).trim();

  if (descripcion !== undefined && descripcion !== null && String(descripcion).length > DESCRIPTION_MAX_LENGTH) {
    throw new ServerError(`La descripcion del canal no puede superar los ${DESCRIPTION_MAX_LENGTH} caracteres`, 400);
  }

  return {
    nombre: nombreNormalizado,
    descripcion: descripcion === undefined || descripcion === null ? undefined : String(descripcion).trim()
  };
}

// Validar que el nombre no esté repetido dentro del mismo workspace -->
// canalesAEvaluar: lista de canales (al actualizar se excluye el propio canal)
function validarNombreUnico(canales, nombre, idCanalAEvaluar) {
  const nombreDuplicado = canales.some(
    (canal) => canal.nombre.toLowerCase() === nombre.toLowerCase() && String(canal._id) !== String(idCanalAEvaluar)
  );

  if (nombreDuplicado) {
    throw new ServerError('Ya existe un canal con ese nombre en este espacio de trabajo', 400);
  }
}

// Crear un canal dentro de un workspace -->
export async function createChannel(workspace_id, datos) {
  const { nombre, descripcion } = validarDatos(datos.name, datos.description);

  const canalesDelWorkspace = await channelRepository.getAllChannelsByWorkpaceId(workspace_id);
  validarNombreUnico(canalesDelWorkspace, nombre);

  const channelCreated = await channelRepository.createChannel(nombre, descripcion, workspace_id);

  return channelCreated;
}

// Obtener la lista de canales de un workspace -->
export async function getChannelsList(workspace_id) {
  const canales = await channelRepository.getAllChannelsByWorkpaceId(workspace_id);

  return canales;
}

// Obtener un canal por ID (siempre validando que pertenezca al workspace) -->
export async function getChannelById(workspace_id, channel_id) {
  const channel = await channelRepository.getChannelById(channel_id, workspace_id);

  if (!channel) {
    throw new ServerError('Canal no encontrado', 404);
  }

  return channel;
}

// Actualizar un canal por ID -->
export async function updateChannelById(workspace_id, channel_id, datos) {
  // Debe existir y pertenecer al workspace de la URL -->
  await getChannelById(workspace_id, channel_id);

  const { nombre, descripcion } = validarDatos(datos.name, datos.description);

  const canalesDelWorkspace = await channelRepository.getAllChannelsByWorkpaceId(workspace_id);
  validarNombreUnico(canalesDelWorkspace, nombre, channel_id);

  const channelActualizado = await channelRepository.updateById(channel_id, nombre, descripcion);

  return channelActualizado;
}

// Eliminar un canal por ID -->
export async function deleteChannelById(workspace_id, channel_id) {
  // Debe existir y pertenecer al workspace de la URL (antes de borrar) -->
  const channel = await getChannelById(workspace_id, channel_id);

  const channelDeleted = await channelRepository.deleteById(channel._id);

  return channelDeleted;
}
