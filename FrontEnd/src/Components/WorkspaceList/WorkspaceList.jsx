import { Link } from "react-router-dom";
import useWorkspaceList from "../../hooks/useWorkspaceList";
import "./WorkspaceList.css";

/*
Imagen del espacio de trabajo (comun a todos por ahora).
Cuando existan logos propios por workspace, este dato vendra del backend.
*/
const WORKSPACE_IMAGE_URL = "https://a.slack-edge.com/80588/img/avatars-teams/ava_0018-88.png";

/*
Paleta para los avatares de miembros: se asigna un color por posicion,
con la paleta Slack del proyecto.
*/
const AVATAR_COLORS = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#481A54"];

const MAX_VISIBLE_AVATARS = 5;

/*
Devuelve la inicial para el avatar de un miembro.
Prioriza el nombre; si no hay, usa la primera letra del email.
*/
function getMemberInitial(member) {
  const nombre = member?.id_usuario?.nombre;
  const email = member?.id_usuario?.email;
  return (nombre || email || "?").charAt(0).toUpperCase();
}

/* Flecha que indica que se puede entrar al workspace */
function ChevronArrow() {
  return (
    <svg
      className="workspace-list__chevron"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3.5L10.5 8L6 12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MemberAvatarStack({ members, member_count }) {
  // member_count null => no pudimos obtener los miembros, no mostramos la fila
  if (member_count === null || member_count === undefined) return null;

  const visible_members = members.slice(0, MAX_VISIBLE_AVATARS);
  const hidden_count = member_count - visible_members.length;

  return (
    <div className="workspace-list__members">
      <div className="workspace-list__avatar-stack">
        {visible_members.map((member, index) => (
          <span
            key={member._id ?? index}
            className="workspace-list__member-avatar"
            style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
          >
            {getMemberInitial(member)}
          </span>
        ))}
        {hidden_count > 0 && (
          <span className="workspace-list__member-avatar workspace-list__member-avatar--more">
            +{hidden_count}
          </span>
        )}
      </div>
      <span className="workspace-list__member-count">
        {member_count === 1 ? "1 miembro" : `${member_count} miembros`}
      </span>
    </div>
  );
}

export default function WorkspaceList() {

  const {
    workspaces_error,
    workspaces_loading,
    workspaces_response,
    reloadWorkspaces
  } = useWorkspaceList()

  if (workspaces_loading) {
    return (
      <div className="workspace-list workspace-list--loading">
        <span className="workspace-list__loader" />
        <p>Cargando espacios de trabajo...</p>
      </div>
    )
  }

  if (workspaces_error) {
    return (
      <div className="workspace-list">
        <span className="workspace-list__error">Error : {workspaces_error}</span>
        <button className="workspace-list__retry" onClick={reloadWorkspaces}>Recargar</button>
      </div>
    )
  }

  if (!workspaces_response) {
    return (
      <div className="workspace-list">
        <span className="workspace-list__error">Error : Ocurrio un problema al obtener la lista de espacios de trabajo</span>
        <button className="workspace-list__retry" onClick={reloadWorkspaces}>Recargar</button>
      </div>
    )
  }

  const has_workspaces = workspaces_response.data.workspaces.length > 0

  return (
    <div className="workspace-list-wrapper">
      {has_workspaces ? (
        <ul className="workspace-list">
          {workspaces_response.data.workspaces.map((workspace) => (
            <li key={workspace.workspace_id} className="workspace-list__item">
              <Link
                className="workspace-list__link"
                to={`/workspace/${workspace.workspace_id}`}
              >
                <img
                  className="workspace-list__image"
                  src={WORKSPACE_IMAGE_URL}
                  alt={`Espacio de trabajo ${workspace.workspace_nombre}`}
                />
                <div className="workspace-list__info">
                  <span className="workspace-list__name">{workspace.workspace_nombre}</span>
                  <MemberAvatarStack
                    members={workspace.members}
                    member_count={workspace.member_count}
                  />
                </div>
                <ChevronArrow />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="workspace-list__empty">Aun no creaste ningun espacio de trabajo</p>
      )}

      <div className="workspace-list__create">
        <Link className="workspace-list__create-toggle" to="/workspace/new">
          <span className="workspace-list__create-plus">+</span>
          Crear espacio de trabajo
        </Link>
      </div>

      <p className="workspace-list__hint">
        No puedes ver tu espacio de trabajo?{' '}
        <Link className="workspace-list__hint-link" to="/login">
          Prueba con otro correo electronico.
        </Link>
      </p>
    </div>
  )
}
