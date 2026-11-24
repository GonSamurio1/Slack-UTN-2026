import { Link } from 'react-router-dom'
import { WorkspaceProvider, useMemberList, useWorkspace } from '../../Contexts/WorkspaceContext'
import ChannelList from '../../Components/ChannelList/ChannelList'
import MemberList from '../../Components/MemberList/MemberList'
import AddMember from '../../Components/AddMember/AddMember'
import DeleteWorkspace from '../../Components/DeleteWorkspace/DeleteWorkspace'
import Alert from '../../Components/Alert/Alert'
import LogoutButton from '../../Components/LogoutButton/LogoutButton'
import { getAuthUserId } from '../../utils/currentUser'
import './WorkspaceScreen.css'

/*
Pantalla del workspace (/workspace/:workspace_id).

Layout (sigue el prototipo de referencias):
  - Header: nombre y descripcion del espacio de trabajo (useWorkspace)
  - Sidebar: ChannelList (useChannelsList), MemberList (useMemberList) y AddMember
  - Area principal: la vista del canal seleccionado

Los datos vienen del WorkspaceContext (montado por el provider de abajo),
que consulta las tres APIs cuando cambia el workspace_id de la URL.
*/

function WorkspaceScreenContent() {

  const {
    workspace_loading,
    workspace_response,
    workspace_error,
    reloadWorkspace
  } = useWorkspace()

  const { members_response } = useMemberList()

  if (workspace_loading) {
    return (
      <div className="workspace-screen workspace-screen--loading">
        <span className="workspace-screen__loader" />
        <p>Cargando espacio de trabajo...</p>
      </div>
    )
  }

  if (workspace_error) {
    return (
      <div className="workspace-screen workspace-screen--error">
        <Alert type="error" message={`Error : ${workspace_error}`} />
        <div className="workspace-screen__error-actions">
          <button className="workspace-screen__retry" onClick={reloadWorkspace}>Recargar</button>
          <Link className="workspace-screen__back-link" to="/">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  if (!workspace_response) {
    return (
      <div className="workspace-screen workspace-screen--error">
        <Alert type="error" message="Error : Ocurrio un problema al obtener el espacio de trabajo" />
        <div className="workspace-screen__error-actions">
          <button className="workspace-screen__retry" onClick={reloadWorkspace}>Recargar</button>
          <Link className="workspace-screen__back-link" to="/">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const workspace = workspace_response.data.workspace

  /*
  Rol del usuario logueado dentro del workspace (se deduce de la lista de
  miembros que ya trae el contexto). El backend permite editar a owner y admin.
  */
  const current_user_id = getAuthUserId()
  const my_membership = members_response?.data?.listMembers?.find(
    (member) => member.id_usuario?._id === current_user_id
  )
  const can_edit = my_membership?.rol === 'owner' || my_membership?.rol === 'admin'

  return (
    <div className="workspace-screen">
      {/* Header: nombre y descripcion del workspace */}
      <header className="workspace-screen__header">
        <Link className="workspace-screen__back" to="/">
          <span className="workspace-screen__back-arrow" aria-hidden="true">←</span>
          Inicio
        </Link>
        <div className="workspace-screen__header-info">
          <h1 className="workspace-screen__name">{workspace.name}</h1>
          {workspace.description && (
            <p className="workspace-screen__description">{workspace.description}</p>
          )}
        </div>
        <div className="workspace-screen__header-actions">
          {can_edit && (
            <Link
              className="workspace-screen__edit"
              to={'/workspace/' + workspace._id + '/edit'}
            >
              Editar espacio
            </Link>
          )}
          <DeleteWorkspace />
          <LogoutButton />
        </div>
      </header>

      <div className="workspace-screen__layout">
        {/* Sidebar: canales, miembros y Add member */}
        <aside className="workspace-screen__sidebar">
          <ChannelList />

          <MemberList />

          <AddMember />
        </aside>

        {/* Area principal: vista del canal seleccionado */}
        <main className="workspace-screen__main">
          <div className="workspace-screen__placeholder">
            <p>Selecciona un canal de la izquierda para ver sus mensajes.</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WorkspaceScreen() {
  return (
    <WorkspaceProvider>
      <WorkspaceScreenContent />
    </WorkspaceProvider>
  )
}
