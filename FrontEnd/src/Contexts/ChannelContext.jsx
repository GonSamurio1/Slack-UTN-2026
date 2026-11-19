import { createContext, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useRequest from '../hooks/useRequest'
import { getChannelById, getChannelMessages } from '../services/channelService'

/*
Contexto a nivel de ruta para un canal especifico.

Se monta en la ruta /workspace/:workspace_id/channel/:channel_id (ver App.jsx),
lee los ids de la URL y consulta a la API:
  - GET /api/workspace/:workspace_id/channels/:channel_id           -> detalles del canal (useChannel)
  - GET /api/workspace/:workspace_id/channels/:channel_id/messages  -> mensajes del canal (useChannelMessages)

Mismo patron que WorkspaceContext: un provider por ruta, los componentes
anidados consumen los datos con los hooks de abajo.
*/
const ChannelContext = createContext(null)

export function ChannelProvider({ children }) {

  const { workspace_id, channel_id } = useParams()

  // Consulta de los detalles del canal (nombre, descripcion)
  const {
    loading: channel_loading,
    response: channel_response,
    error: channel_error,
    sendRequest: sendChannelRequest
  } = useRequest()

  // Consulta de la lista de mensajes
  const {
    loading: messages_loading,
    response: messages_response,
    error: messages_error,
    sendRequest: sendMessagesRequest
  } = useRequest()

  // Al cambiar el canal de la URL se consultan ambas APIs
  useEffect(
    () => {
      sendChannelRequest(() => getChannelById(workspace_id, channel_id))
      sendMessagesRequest(() => getChannelMessages(workspace_id, channel_id))
    },
    [channel_id]
  )

  function reloadChannel() {
    sendChannelRequest(() => getChannelById(workspace_id, channel_id))
  }

  function reloadChannelMessages() {
    sendMessagesRequest(() => getChannelMessages(workspace_id, channel_id))
  }

  const context_value = {
    workspace_id,
    channel_id,
    // Detalles del canal
    channel_loading,
    channel_response,
    channel_error,
    // Mensajes del canal
    messages_loading,
    messages_response,
    messages_error,
    reloadChannel,
    reloadChannelMessages
  }

  return (
    <ChannelContext.Provider value={context_value}>
      {children}
    </ChannelContext.Provider>
  )
}

/*
Hook de consumo del contexto. Solo es utilizable dentro de la ruta
/workspace/:workspace_id/channel/:channel_id (donde el provider esta montado).
*/
export function useChannelContext() {
  return useContext(ChannelContext)
}

/*
useChannel -> GET /api/workspace/:workspace_id/channels/:channel_id
Datos del canal: channel_response.data.channel (nombre, descripcion, fecha_creacion)
*/
export function useChannel() {
  const context = useChannelContext()
  return {
    workspace_id: context.workspace_id,
    channel_id: context.channel_id,
    channel_loading: context.channel_loading,
    channel_response: context.channel_response,
    channel_error: context.channel_error,
    reloadChannel: context.reloadChannel
  }
}

/*
useChannelMessages -> GET /api/workspace/:workspace_id/channels/:channel_id/messages
Lista de mensajes: messages_response.data.messagesList
(cada item: contenido, emisor_id poblado con nombre y email, fecha_creacion, editado)
*/
export function useChannelMessages() {
  const context = useChannelContext()
  return {
    channel_id: context.channel_id,
    messages_loading: context.messages_loading,
    messages_response: context.messages_response,
    messages_error: context.messages_error,
    reloadChannelMessages: context.reloadChannelMessages
  }
}
