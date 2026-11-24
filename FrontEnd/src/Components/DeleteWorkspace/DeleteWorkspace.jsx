import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceContext } from '../../Contexts/WorkspaceContext'
import { deleteWorkspace } from '../../services/workspaceService'
import { getAuthUserId } from '../../utils/currentUser'
import Alert from '../Alert/Alert'
import './DeleteWorkspace.css'

/*
Boton "Eliminar espacio" del header del workspace.

Solo se muestra al propietario (rol 'owner'), que es el unico rol habilitado
en el backend para borrar un workspace. Antes de eliminar pide confirmacion
explicita, porque el borrado es en cascada: membresias, canales y mensajes.

El rol del usuario logueado se deduce de la lista de miembros que ya trae el
WorkspaceContext (GET /api/workspace/:workspace_id/members), comparando el id
del token (getAuthUserId) con el id_usuario de cada membresia.

Al borrar con exito se navega al Home, que vuelve a consultar la lista de
espacios de trabajo y ya no muestra el eliminado.
*/
export default function DeleteWorkspace() {

  const {
    workspace_id,
    workspace_response,
    members_response
  } = useWorkspaceContext()

  const navigate = useNavigate()

  const [loading, set_loading] = useState(false)
  const [error, set_error] = useState(null)

  const current_user_id = getAuthUserId()
  const my_membership = members_response?.data?.listMembers?.find(
    (member) => member.id_usuario?._id === current_user_id
  )

  // Mientras no se conozca la membresia (o si no es owner) no se ofrece la accion
  if (my_membership?.rol !== 'owner') {
    return null
  }

  async function handleDelete() {
    const nombre = workspace_response?.data?.workspace?.name || 'este espacio de trabajo'

    const confirmado = window.confirm(
      `Eliminar "${nombre}"?\n\nSe van a borrar tambien sus canales, mensajes y membresias. Esta accion no se puede deshacer.`
    )

    if (!confirmado) return

    try {
      set_loading(true)
      set_error(null)
      await deleteWorkspace(workspace_id)
      navigate('/')
    } catch (error) {
      set_error(error.message)
    } finally {
      set_loading(false)
    }
  }

  return (
    <div className="delete-workspace">
      <button
        type="button"
        className="delete-workspace__button"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? 'Eliminando...' : 'Eliminar espacio'}
      </button>

      {error && (
        <div className="delete-workspace__error">
          <Alert type="error" message={`Error : ${error}`} />
        </div>
      )}
    </div>
  )
}
