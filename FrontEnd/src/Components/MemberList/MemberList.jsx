import { useEffect, useState } from 'react'
import { useMemberList } from '../../Contexts/WorkspaceContext'
import { updateWorkspaceMember, deleteWorkspaceMember } from '../../services/workspaceService'
import { getAuthUserId } from '../../utils/currentUser'
import "./MemberList.css"

/*
Lista de miembros del workspace (columna izquierda, debajo de los canales).

Paleta de avatares: la misma que usa WorkspaceList en el HomeScreen,
se asigna un color por posicion con la paleta Slack del proyecto.

Acciones (owner/admin): cambiar el rol y expulsar. La visibilidad replica la
jerarquia del backend:
  - al owner no se lo puede modificar ni expulsar;
  - un admin solo gestiona a los miembros con rol 'user'
    (no a otros admins ni a si mismo);
  - un user no ve acciones.
*/
const AVATAR_COLORS = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#481A54"];

/*
Devuelve la inicial para el avatar de un miembro.
Prioriza el nombre; si no hay, usa la primera letra del email.
*/
function getMemberInitial(member) {
  const nombre = member?.id_usuario?.nombre;
  const email = member?.id_usuario?.email;
  return (nombre || email || "?").charAt(0).toUpperCase();
}

/* Texto visible del rol (el backend guarda owner/admin/user) */
const ROLE_LABELS = {
  owner: "Propietario",
  admin: "Administrador",
  user: "Miembro"
};

function MemberItem({ member, index, workspace_id, my_role, reloadWorkspace }) {

  // Rol elegido en el select: se actualiza al instante y se sincroniza
  // cuando la lista se recarga (o si el backend rechaza el cambio)
  const [rol_seleccionado, set_rol_seleccionado] = useState(member.rol)

  const [action_loading, set_action_loading] = useState(false)
  const [action_error, set_action_error] = useState(null)

  useEffect(
    () => {
      set_rol_seleccionado(member.rol)
    },
    [member.rol]
  )

  const nombre = member.id_usuario?.nombre || member.id_usuario?.email || 'este miembro'

  /*
  Quien puede gestionar esta fila:
    - owner: a todos menos al owner (incluidos otros admins);
    - admin: solo a los 'user' (ni otros admins ni a si mismo).
  */
  const puede_gestionar =
    (my_role === 'owner' && member.rol !== 'owner') ||
    (my_role === 'admin' && member.rol === 'user')

  /* Cambiar el rol: PUT + recarga de la lista */
  async function handleRoleChange(event) {
    const nuevo_rol = event.target.value

    if (nuevo_rol === member.rol) return

    set_rol_seleccionado(nuevo_rol)

    try {
      set_action_loading(true)
      set_action_error(null)
      await updateWorkspaceMember(workspace_id, member._id, nuevo_rol)
      reloadWorkspace()
    } catch (error) {
      // El cambio no se aplico: volvemos a mostrar el rol real
      set_rol_seleccionado(member.rol)
      set_action_error(error.message)
    } finally {
      set_action_loading(false)
    }
  }

  /* Expulsar al miembro: DELETE + recarga de la lista */
  async function handleDelete() {
    const confirmado = window.confirm(`Expulsar a ${nombre} del espacio de trabajo?`)
    if (!confirmado) return

    try {
      set_action_loading(true)
      set_action_error(null)
      await deleteWorkspaceMember(workspace_id, member._id)
      reloadWorkspace()
    } catch (error) {
      set_action_error(error.message)
    } finally {
      set_action_loading(false)
    }
  }

  return (
    <li className="member-list__item">
      <span
        className="member-list__avatar"
        style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
      >
        {getMemberInitial(member)}
      </span>
      <div className="member-list__info">
        <span className="member-list__name">{member.id_usuario?.nombre || member.id_usuario?.email}</span>

        {puede_gestionar ? (
          <div className="member-list__role-row">
            <select
              className="member-list__role-select"
              value={rol_seleccionado}
              onChange={handleRoleChange}
              disabled={action_loading}
              aria-label={`Rol de ${nombre}`}
            >
              <option value="user">Miembro</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="button"
              className="member-list__remove"
              onClick={handleDelete}
              disabled={action_loading}
              aria-label={`Expulsar a ${nombre}`}
              title="Expulsar del espacio de trabajo"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="member-list__role">{ROLE_LABELS[member.rol] || member.rol}</span>
        )}

        {action_error && (
          <span className="member-list__item-error">{action_error}</span>
        )}
      </div>
    </li>
  );
}

export default function MemberList() {

  const {
    workspace_id,
    members_loading,
    members_response,
    members_error,
    reloadWorkspace
  } = useMemberList()

  if (members_loading) {
    return (
      <div className="member-list member-list--loading">
        <span className="member-list__loader" />
        <p>Cargando miembros...</p>
      </div>
    )
  }

  if (members_error) {
    return (
      <div className="member-list">
        <span className="member-list__error">Error : {members_error}</span>
        <button className="member-list__retry" onClick={reloadWorkspace}>Recargar</button>
      </div>
    )
  }

  if (!members_response) {
    return (
      <div className="member-list">
        <span className="member-list__error">Error : Ocurrio un problema al obtener la lista de miembros</span>
        <button className="member-list__retry" onClick={reloadWorkspace}>Recargar</button>
      </div>
    )
  }

  const members = members_response.data.listMembers

  // Rol del usuario logueado: se busca su membresia en la misma lista
  const current_user_id = getAuthUserId()
  const my_membership = members.find(
    (member) => member.id_usuario?._id === current_user_id
  )
  const my_role = my_membership?.rol

  return (
    <section className="member-list">
      <h2 className="member-list__title">
        Miembros {members.length > 0 && <span className="member-list__count">({members.length})</span>}
      </h2>

      {members.length > 0 ? (
        <ul className="member-list__items">
          {members.map((member, index) => (
            <MemberItem
              key={member._id ?? index}
              member={member}
              index={index}
              workspace_id={workspace_id}
              my_role={my_role}
              reloadWorkspace={reloadWorkspace}
            />
          ))}
        </ul>
      ) : (
        <p className="member-list__empty">Este espacio no tiene miembros</p>
      )}
    </section>
  )
}
