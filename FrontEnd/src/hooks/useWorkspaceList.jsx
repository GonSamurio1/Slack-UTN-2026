import { useEffect, useState } from "react"
import { getAllWorkspaces, getWorkspaceMembers } from "../services/workspaceService"
import useRequest from "./useRequest"

function useWorkspaceList() {

  const { response, error, loading, sendRequest } = useRequest()
  const [workspaces_with_members, setWorkspacesWithMembers] = useState(null)

  // Con este efecto me aseguro que sendRequest solo se ejecuta una vez
  useEffect(
    () => {
      sendRequest(
        getAllWorkspaces
      )
    },
    []
  )

  /*
  Cuando llega la lista de workspaces, pedimos los miembros de cada uno
  (N+1: un request por workspace). Si el fetch de miembros de alguno falla,
  el workspace se muestra igual, solo sin avatares.
  */
  useEffect(
    () => {
      if (!response?.data?.workspaces) return

      async function attachMembers() {
        const enriched = await Promise.allSettled(
          response.data.workspaces.map((workspace) =>
            getWorkspaceMembers(workspace.workspace_id)
              .then((members_response) => ({
                ...workspace,
                members: members_response.data.listMembers ?? [],
                member_count: members_response.data.listMembers?.length ?? 0
              }))
              .catch(() => ({
                ...workspace,
                members: [],
                member_count: null
              }))
          )
        )

        setWorkspacesWithMembers(
          enriched.map((result) => result.value ?? result.reason)
        )
      }

      attachMembers()
    },
    [response]
  )

  function reloadWorkspaces() {
    setWorkspacesWithMembers(null)
    sendRequest(
      () => getAllWorkspaces()
    )
  }

  return {
    // Esperamos a que tambien esten los miembros para no renderizar dos veces
    workspaces_response: workspaces_with_members ? { data: { workspaces: workspaces_with_members } } : null,
    workspaces_error: error,
    workspaces_loading: loading || (response && !workspaces_with_members),
    reloadWorkspaces
  }
}

export default useWorkspaceList
