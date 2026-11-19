import { useMemberList } from '../../Contexts/WorkspaceContext'
import "./MemberList.css"

/*
Lista de miembros del workspace (columna izquierda, debajo de los canales).

Paleta de avatares: la misma que usa WorkspaceList en el HomeScreen,
se asigna un color por posicion con la paleta Slack del proyecto.
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

function MemberItem({ member, index }) {
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
        <span className="member-list__role">{ROLE_LABELS[member.rol] || member.rol}</span>
      </div>
    </li>
  );
}

export default function MemberList() {

  const {
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

  return (
    <section className="member-list">
      <h2 className="member-list__title">
        Miembros {members.length > 0 && <span className="member-list__count">({members.length})</span>}
      </h2>

      {members.length > 0 ? (
        <ul className="member-list__items">
          {members.map((member, index) => (
            <MemberItem key={member._id ?? index} member={member} index={index} />
          ))}
        </ul>
      ) : (
        <p className="member-list__empty">Este espacio no tiene miembros</p>
      )}
    </section>
  )
}
