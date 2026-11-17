import { createContext, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useRequest from '../hooks/useRequest'
import { getWorkspaceById, getWorkspaceMembers } from '../services/workspaceService'

/*
Contexto a nivel de ruta para un workspace especifico.

Se monta en la ruta /workspace/:workspace_id (ver App.jsx), lee el
workspace_id de la URL y consulta a la API:
  - GET /api/workspace/:workspace_id           -> detalles del workspace
  - GET /api/workspace/:workspace_id/members   -> lista de membresias

Ambas consultas usan el hook useRequest. Cualquier componente anidado
a la ruta puede consumir estos datos con useWorkspaceContext().
*/
const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {

  const { workspace_id } = useParams()

  // Consulta de los detalles del workspace
  const {
    loading: workspace_loading,
    response: workspace_response,
    error: workspace_error,
    sendRequest: sendWorkspaceRequest
  } = useRequest()

  // Consulta de la lista de membresias
  const {
    loading: members_loading,
    response: members_response,
    error: members_error,
    sendRequest: sendMembersRequest
  } = useRequest()

  // Al cambiar el id de la URL se consultan ambas APIs
  useEffect(
    () => {
      sendWorkspaceRequest(() => getWorkspaceById(workspace_id))
      sendMembersRequest(() => getWorkspaceMembers(workspace_id))
    },
    [workspace_id]
  )

  // Log de estados de la API de detalles del workspace
  useEffect(
    () => {
      console.log('[WorkspaceContext] workspace -> loading:', workspace_loading)
      console.log('[WorkspaceContext] workspace -> response:', workspace_response)
      console.log('[WorkspaceContext] workspace -> error:', workspace_error)
    },
    [workspace_loading, workspace_response, workspace_error]
  )

  // Log de estados de la API de miembros
  useEffect(
    () => {
      console.log('[WorkspaceContext] members -> loading:', members_loading)
      console.log('[WorkspaceContext] members -> response:', members_response)
      console.log('[WorkspaceContext] members -> error:', members_error)
    },
    [members_loading, members_response, members_error]
  )

  function reloadWorkspace() {
    sendWorkspaceRequest(() => getWorkspaceById(workspace_id))
    sendMembersRequest(() => getWorkspaceMembers(workspace_id))
  }

  const context_value = {
    workspace_id,
    // Detalles del workspace
    workspace_loading,
    workspace_response,
    workspace_error,
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
