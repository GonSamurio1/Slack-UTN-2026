import workspaceRepository from "../repositories/workspace.repository.js"
import ServerError from "../utils/error.util.js"
import memberRepository from "../repositories/member.repository.js"

/*
Validar que el espacio de trabjo exista
Validar que quien consulta sea parte de este espacio de trbajo
  Revisar que sea miembro que de este worksapce (que tenga membresia)
Validar el rol de quien consulta
*/

function workspaceMiddleware(valid_roles = []) {
  return async function workspaceMiddleware(req, res, next) {

    const { workspace_id } = req.params
    const workspace_selected = await workspaceRepository.getByID(workspace_id)

    const membership = await memberRepository.getMembershipByUserAndWorkspace(req.user.id, workspace_id)
    console.log('[WorkspaceMiddleware]:', membership, workspace_id, req.user)


    if (!workspace_selected) {
      throw new ServerError('Workspace no encontrado', 404)
    }

    if (!membership) {
      throw new ServerError('No pertences a este espacio de trabajo', 403)
    }

    if (valid_roles.length > 0 && !valid_roles.includes(membership.rol)) {
      throw new ServerError('No tenes permisos suficientes para hacer esta operacion', 403)
    }

    req.workspace = workspace_selected
    req.membership = membership
    next()
  }
}
export default workspaceMiddleware
