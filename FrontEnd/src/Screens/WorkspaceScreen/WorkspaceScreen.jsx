import { useEffect } from 'react'
import { WorkspaceProvider, useWorkspaceContext } from '../../Contexts/WorkspaceContext'

/*
Pantalla del workspace: por ahora vacia. El contenido futuro (canales,
mensajes, etc.) consume los datos del workspace desde el contexto.
*/

function WorkspaceScreenContent() {
  const {
    workspace_loading,
    workspace_response,
    workspace_error,
    members_loading,
    members_response,
    members_error
  } = useWorkspaceContext()

  // Log de estados de carga y respuestas de ambas APIs
  useEffect(
    () => {
      console.log('[WorkspaceScreen] estado de carga ->', {
        workspace_loading: workspace_loading,
        members_loading: members_loading
      })
    },
    [workspace_loading, members_loading]
  )

  useEffect(
    () => {
      if (!workspace_loading) {
        console.log('[WorkspaceScreen] respuesta de workspace ->', workspace_response ?? workspace_error)
      }
    },
    [workspace_loading, workspace_response, workspace_error]
  )

  useEffect(
    () => {
      if (!members_loading) {
        console.log('[WorkspaceScreen] respuesta de members ->', members_response ?? members_error)
      }
    },
    [members_loading, members_response, members_error]
  )

  // Pantalla vacia por ahora
  return null
}

export default function WorkspaceScreen() {
  return (
    <WorkspaceProvider>
      <WorkspaceScreenContent />
    </WorkspaceProvider>
  )
}
