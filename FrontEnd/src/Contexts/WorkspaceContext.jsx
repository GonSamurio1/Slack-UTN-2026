import { createContext, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useRequest from '../hooks/useRequest'
import { getWorkspaceById, getWorkspaceMembers } from '../services/workspaceService'
import { getChannels } from '../services/channelService'

/*
Contexto a nivel de ruta para un workspace especifico.

Se monta en la ruta /workspace/:workspace_id (ver App.jsx), lee el
workspace_id de la URL y consulta a la API:
  - GET /api/workspace/:workspace_id           -> detalles del workspace (useWorkspace)
  - GET /api/workspace/:workspace_id/channels  -> lista de canales (useChannelsList)
  - GET /api/workspace/:workspace_id/members   -> lista de membresias (useMemberList)

Todas las consultas usan el hook useRequest. Cualquier componente anidado
a la ruta puede consumir estos datos con los hooks de abajo.
*/
const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {

  const { workspace_id } = useParams()

  // Consulta de los detalles del workspace (nombre, descripcion)
  const {
    loading: workspace_loading,
    response: workspace_response,
    error: workspace_error,
    sendRequest: sendWorkspaceRequest
  } = useRequest()

  // Consulta de la lista de canales
  const {
    loading: channels_loading,
    response: channels_response,
    error: channels_error,
    sendRequest: sendChannelsRequest
  } = useRequest()

  // Consulta de la lista de membresias
  const {
    loading: members_loading,
    response: members_response,
    error: members_error,
    sendRequest: sendMembersRequest
  } = useRequest()

  // Al cambiar el id de la URL se consultan las tres APIs
  useEffect(
    () => {
      sendWorkspaceRequest(() => getWorkspaceById(workspace_id))
      sendChannelsRequest(() => getChannels(workspace_id))
      sendMembersRequest(() => getWorkspaceMembers(workspace_id))
    },
    [workspace_id]
  )

  function reloadWorkspace() {
    sendWorkspaceRequest(() => getWorkspaceById(workspace_id))
    sendChannelsRequest(() => getChannels(workspace_id))
    sendMembersRequest(() => getWorkspaceMembers(workspace_id))
  }

  const context_value = {
    workspace_id,
    // Detalles del workspace
    workspace_loading,
    workspace_response,
    workspace_error,
    // Canales del workspace
    channels_loading,
    channels_response,
    channels_error,
    // Miembros del workspace
    members_loading,
    members_response,
    members_error,
    reloadWorkspace
  }

  return (
    <WorkspaceContext.Provider value={context_value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

/*
Hook de consumo del contexto. Solo es utilizable dentro de la ruta
/workspace/:workspace_id (donde el provider esta montado).
*/
export function useWorkspaceContext() {
  return useContext(WorkspaceContext)
}

/*
useWorkspace -> GET /api/workspace/:workspace_id
Datos del workspace: workspace_response.data.workspace (name, description, fecha_creacion)
*/
export function useWorkspace() {
  const context = useWorkspaceContext()
  return {
    workspace_id: context.workspace_id,
    workspace_loading: context.workspace_loading,
    workspace_response: context.workspace_response,
    workspace_error: context.workspace_error,
    reloadWorkspace: context.reloadWorkspace
  }
}

/*
useChannelsList -> GET /api/workspace/:workspace_id/channels
Lista de canales: channels_response.data.channelsList
(_id, nombre, descripcion, fecha_creacion)
*/
export function useChannelsList() {
  const context = useWorkspaceContext()
  return {
    workspace_id: context.workspace_id,
    channels_loading: context.channels_loading,
    channels_response: context.channels_response,
    channels_error: context.channels_error,
    reloadWorkspace: context.reloadWorkspace
  }
}

/*
useMemberList -> GET /api/workspace/:workspace_id/members
Lista de membresias: members_response.data.listMembers
(cada item tiene id_usuario poblado con nombre y email, y el rol)
*/
export function useMemberList() {
  const context = useWorkspaceContext()
  return {
    workspace_id: context.workspace_id,
    members_loading: context.members_loading,
    members_response: context.members_response,
    members_error: context.members_error,
    reloadWorkspace: context.reloadWorkspace
  }
}
