import { useEffect } from "react"
import { getAllWorkspaces } from "../services/workspaceService"
import useRequest from "./useRequest"

function useWorkspaceList() {

  const { response, error, loading, sendRequest } = useRequest()

  // Con este efecto me aseguro que sendRequest solo se ejcuta una vez
  useEffect(
    () => {
      sendRequest(
        getAllWorkspaces
      )
    },
    []
  )

  function reloadWorkspaces() {
    sendRequest(
      () => getAllWorkspaces()
    )
  }

  return {
    workspaces_response: response,
    workspaces_error: error,
    workspaces_loading: loading,
    reloadWorkspaces
  }
}

export default useWorkspaceList