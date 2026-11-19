import { useEffect, useRef, useState } from 'react'
import { useChannelContext, useChannelMessages } from '../../Contexts/ChannelContext'
import { updateChannelMessage, deleteChannelMessage } from '../../services/channelService'
import { getAuthUserId } from '../../utils/currentUser'
import Alert from '../Alert/Alert'
import "./MessageList.css"

/*
Lista de mensajes del canal (area principal de ChannelScreen).

- Cada mensaje muestra el avatar con la inicial del emisor, su nombre,
  la hora y el contenido. Si fue editado, agrega "(editado)".
- Los mensajes PROPIOS (comparando el emisor con el usuario del token)
  muestran los botones Editar y Eliminar al pasar el mouse.
- Editar abre un textarea inline; guardar llama al PUT y recarga la lista.
- Al cargar/cambiar los mensajes, la lista scrollea hasta el ultimo.
*/

/* Misma paleta de avatares que WorkspaceList y MemberList */
const AVATAR_COLORS = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#481A54"];

function getEmisorInitial(message) {
  const nombre = message?.emisor_id?.nombre;
  const email = message?.emisor_id?.email;
  return (nombre || email || "?").charAt(0).toUpperCase();
}

function formatMessageTime(fecha_creacion) {
  return new Date(fecha_creacion).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/*
Un mensaje individual.
Props: message (dato del backend), index, is_own, action_loading,
onEditSave(message, nuevo_contenido), onDelete(message).
*/
function MessageItem({ message, index, is_own, action_loading, onEditSave, onDelete }) {

  // El modo edicion es local al mensaje: solo uno abierto a la vez
  // porque al abrir uno se cierra el anterior (onEditOpen de arriba).
  const [is_editing, set_is_editing] = useState(false)
  const [edit_value, set_edit_value] = useState('')

  function startEdit() {
    set_edit_value(message.contenido)
    set_is_editing(true)
  }

  function cancelEdit() {
    set_is_editing(false)
    set_edit_value('')
  }

  async function saveEdit() {
    const value = edit_value.trim()
    if (!value || value === message.contenido) {
      cancelEdit()
      return
    }

    const ok = await onEditSave(message, value)
    if (ok) cancelEdit()
  }

  return (
    <li className={`message-list__item ${is_own ? 'message-list__item--own' : ''}`}>
      <span
        className="message-list__avatar"
        style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
      >
        {getEmisorInitial(message)}
      </span>

      <div className="message-list__body">
        <div className="message-list__meta">
          <span className="message-list__author">
            {message.emisor_id?.nombre || message.emisor_id?.email || 'Usuario'}
          </span>
          {is_own && <span className="message-list__you">(vos)</span>}
          <span className="message-list__time">{formatMessageTime(message.fecha_creacion)}</span>
          {message.editado && <span className="message-list__edited">(editado)</span>}
        </div>

        {is_editing ? (
          <div className="message-list__edit">
            <textarea
              className="message-list__edit-input"
              name="edit_contenido"
              value={edit_value}
              onChange={(event) => set_edit_value(event.target.value)}
              rows={2}
              maxLength={2000}
              disabled={action_loading}
            />
            <div className="message-list__edit-actions">
              <button
                type="button"
                className="message-list__action message-list__action--save"
                onClick={saveEdit}
                disabled={action_loading}
              >
                Guardar
              </button>
              <button
                type="button"
                className="message-list__action message-list__action--cancel"
                onClick={cancelEdit}
                disabled={action_loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="message-list__content">{message.contenido}</p>
        )}
      </div>

      {is_own && !is_editing && (
        <div className="message-list__actions">
          <button
            type="button"
            className="message-list__action"
            onClick={startEdit}
            disabled={action_loading}
          >
            Editar
          </button>
          <button
            type="button"
            className="message-list__action message-list__action--danger"
            onClick={() => onDelete(message)}
            disabled={action_loading}
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  )
}

export default function MessageList() {

  const { workspace_id, channel_id } = useChannelContext()
  const {
    messages_loading,
    messages_response,
    messages_error,
    reloadChannelMessages
  } = useChannelMessages()

  // Id del usuario logueado (desde el payload del token): define que mensajes son "propios"
  const current_user_id = getAuthUserId()

  // Estado de la accion en curso (editar o eliminar un mensaje)
  const [action_loading, set_action_loading] = useState(false)
  const [action_error, set_action_error] = useState(null)

  // Para scrollear al ultimo mensaje cuando llegan mensajes nuevos
  const list_end_ref = useRef(null)

  useEffect(
    () => {
      list_end_ref.current?.scrollIntoView({ block: 'end' })
    },
    [messages_response]
  )

  /*
  Editar un mensaje propio: PUT + recarga de la lista.
  Devuelve true si salio bien (para cerrar el textarea de edicion).
  */
  async function handleEditSave(message, nuevo_contenido) {
    try {
      set_action_loading(true)
      set_action_error(null)
      await updateChannelMessage(workspace_id, channel_id, message._id, nuevo_contenido)
      reloadChannelMessages()
      return true
    } catch (error) {
      set_action_error(error.message)
      return false
    } finally {
      set_action_loading(false)
    }
  }

  /* Eliminar un mensaje propio: DELETE + recarga de la lista */
  async function handleDelete(message) {
    const confirmado = window.confirm('Eliminar este mensaje?')
    if (!confirmado) return

    try {
      set_action_loading(true)
      set_action_error(null)
      await deleteChannelMessage(workspace_id, channel_id, message._id)
      reloadChannelMessages()
    } catch (error) {
      set_action_error(error.message)
    } finally {
      set_action_loading(false)
    }
  }

  if (messages_loading) {
    return (
      <div className="message-list message-list--loading">
        <span className="message-list__loader" />
        <p>Cargando mensajes...</p>
      </div>
    )
  }

  if (messages_error) {
    return (
      <div className="message-list">
        <Alert type="error" message={`Error : ${messages_error}`} />
        <button className="message-list__retry" onClick={reloadChannelMessages}>Recargar</button>
      </div>
    )
  }

  if (!messages_response) {
    return (
      <div className="message-list">
        <Alert type="error" message="Error : Ocurrio un problema al obtener los mensajes" />
        <button className="message-list__retry" onClick={reloadChannelMessages}>Recargar</button>
      </div>
    )
  }

  const messages = messages_response.data.messagesList

  return (
    <div className="message-list">
      {action_error && (
        <Alert type="error" message={action_error} />
      )}

      {messages.length > 0 ? (
        <ul className="message-list__items">
          {messages.map((message, index) => (
            <MessageItem
              key={message._id ?? index}
              message={message}
              index={index}
              is_own={String(message.emisor_id?._id ?? '') === String(current_user_id ?? '')}
              action_loading={action_loading}
              onEditSave={handleEditSave}
              onDelete={handleDelete}
            />
          ))}
          <li ref={list_end_ref} aria-hidden="true" />
        </ul>
      ) : (
        <p className="message-list__empty">Aun no hay mensajes. Escribi el primero!</p>
      )}
    </div>
  )
}
