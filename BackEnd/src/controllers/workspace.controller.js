import jwt from 'jsonwebtoken'
import workspaceRepository from "../repositories/workspace.repository.js"
import memberRepository from "../repositories/member.repository.js";
import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js";
import ENVIROMMENT from "../config/enviromment.config.js"
import mailerTransporter from "../config/mailer.config.js"
import { workspaceInviteTemplate } from "../utils/email-templates/workspace-invite.template.js"

// Los modelos limitan name a 30 y description a 1000 caracteres;
// validamos al entrar para devolver 400 con mensajes claros (no 500).
const MAX_LEN_NAME = 30;
const MAX_LEN_DESCRIPTION = 1000;

// El nombre es obligatorio y no puede vaciarse ni superar los 30 caracteres
function validarNombreWorkspace(name) {
  const nombreNormalizado = name === undefined || name === null ? '' : String(name).trim();

  if (nombreNormalizado === '') {
    throw new ServerError('El nombre del espacio de trabajo es obligatorio', 400);
  }

  if (nombreNormalizado.length > MAX_LEN_NAME) {
    throw new ServerError(`El nombre del espacio de trabajo no puede superar los ${MAX_LEN_NAME} caracteres`, 400);
  }

  return nombreNormalizado;
}

// La descripción es opcional; si se da, debe ser texto y no puede superar
// los 1000 caracteres. Un string vacío equivale a no enviarla.
function validarDescripcionWorkspace(descripcion) {
  if (descripcion === undefined || descripcion === null) {
    return undefined;
  }

  if (typeof descripcion !== 'string') {
    throw new ServerError('La descripción del espacio de trabajo debe ser un texto', 400);
  }

  const descripcionNormalizada = descripcion.trim();

  // La descripción es opcional: un string vacío equivale a no enviarla
  if (descripcionNormalizada === '') {
    return undefined;
  }

  if (descripcionNormalizada.length > MAX_LEN_DESCRIPTION) {
    throw new ServerError(`La descripción del espacio de trabajo no puede superar los ${MAX_LEN_DESCRIPTION} caracteres`, 400);
  }

  return descripcionNormalizada;
}

// Crear un nuevo workspace -->
export async function createWorkspace(req, res) {
  const { name, description } = req.body || {};

  const nombreNormalizado = validarNombreWorkspace(name);
  const descripcionNormalizada = validarDescripcionWorkspace(description);

  const workspaceCreated = await workspaceRepository.createWorkSpace(nombreNormalizado, descripcionNormalizada);

  let membership;
  try {
    membership = await memberRepository.create(
      req.user.id,
      workspaceCreated._id,
      'owner'
    );
  } catch (error) {
    // Si falló la membresía, el workspace queda huérfano: borrarlo
    await workspaceRepository.deleteById(workspaceCreated._id);
    throw error;
  }

  return res.status(201).json({
    ok: true,
    status: 201,
    message: "Espacio de trabajo creado con éxito",
    data: {
      workspace: workspaceCreated,
      membership
    }
  });
}

// Obtener todos los wrokspace del usuario autentificado -->
export async function getUserWorkspaces(req, res) {
  const memberships = await memberRepository.getAllWorkspaceByUserId(req.user.id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Lista de espacios de trabajo del usuario obtenida con éxito",
    data: {
      workspaces: memberships
    }
  });
}

// Obtener un workspace especifico por ID -->
export async function getWorkspaceById(req, res) {
  const { workspace_id } = req.params;

  const workspace = await workspaceRepository.getByID(workspace_id);

  if (!workspace) {
    throw new ServerError("Espacio de trabajo no encontrado", 404);
  }

  return res.status(200).json({
    ok: true,
    status: 200,
    message: "Detalles del espacio de trabajo obtenidos con éxito",
    data: {
      workspace
    }
  });
}

// Actualizar un Workspace por ID
export async function updateWorkspaceById(req, res) {
  const { workspace_id } = req.params
  const { name, description } = req.body || {}

  const updateData = {};

  if (name !== undefined) {
    updateData.name = validarNombreWorkspace(name);
  }
  if (description !== undefined) {
    const descripcionNormalizada = validarDescripcionWorkspace(description);
    if (descripcionNormalizada !== undefined) {
      updateData.description = descripcionNormalizada;
    }
  }

  // Sin campos válidos no hay nada que actualizar (evita un update vacío)
  if (Object.keys(updateData).length === 0) {
    throw new ServerError('No hay campos para actualizar', 400);
  }

  const workspaceActualizado = await workspaceRepository.updateById(
    workspace_id,
    updateData
  )

  if (!workspaceActualizado) {
    throw new ServerError('Espacio de trabajo no encontrado', 404);
  }

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Espacio de trabajo actualizado correctamente',
    data: {
      workspace: workspaceActualizado
    }
  })
}

// Eliminar un Workspace por ID (con borrado en cascada de membresías, canales y mensajes) -->
export async function deleteWorkspaceById(req, res) {
  const { workspace_id } = req.params

  const worksapceDeleted = await workspaceRepository.deleteByIdWithCascade(workspace_id)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Espacio de trabajo eliminado',
    data: {
      workspaceDelete: worksapceDeleted
    }
  })
}

// Eliminar un miembro de un Workspace por ID (con jerarquía de roles) -->
export async function deleteMemberByRole(req, res) {
  const { workspace_id, member_id } = req.params

  const member = await memberRepository.getByIdAndWorkspace(member_id, workspace_id);

  if (!member) {
    throw new ServerError('Miembro no encontrado', 404);
  }

  const rolActor = req.membership?.rol;
  const rolTarget = member.rol;

  // El propietario del workspace no se puede expulsar
  if (rolTarget === 'owner') {
    throw new ServerError('No se puede eliminar al propietario del espacio de trabajo', 403);
  }

  // Un admin no puede expulsar a otro admin; solo puede hacerlo el owner
  if (rolTarget === 'admin' && rolActor !== 'owner') {
    throw new ServerError('Solo el propietario del espacio de trabajo puede eliminar administradores', 403);
  }

  const memberDeletd = await memberRepository.deleteById(member_id, workspace_id);

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Miembro eliminado correctamente',
    data: {
      memberDeletd
    }
  })
}

// Actualizar el rol de un miembro de un Workspace (con jerarquía de roles) -->
export async function updateMemberRole(req, res) {
  const { workspace_id, member_id } = req.params
  const { rol } = req.body || {}

  // El rol destino solo puede ser admin o user: el owner no se transfiere por acá
  if (rol !== 'admin' && rol !== 'user') {
    throw new ServerError('Rol invalido para ejecutar esta accion', 400)
  }

  const member = await memberRepository.getByIdAndWorkspace(member_id, workspace_id);

  if (!member) {
    throw new ServerError('Miembro no encontrado', 404);
  }

  const rolActor = req.membership?.rol;
  const rolTarget = member.rol;

  // El propietario del workspace no se puede modificar
  if (rolTarget === 'owner') {
    throw new ServerError('No se puede modificar el rol del propietario del espacio de trabajo', 403);
  }

  // Un admin no puede modificar a otro admin; solo puede hacerlo el owner
  if (rolTarget === 'admin' && rolActor !== 'owner') {
    throw new ServerError('Solo el propietario del espacio de trabajo puede modificar administradores', 403);
  }

  const memberUpdated = await memberRepository.updateRoleById(member_id, workspace_id, rol);

  if (!memberUpdated) {
    throw new ServerError('Miembro no encontrado', 404);
  }

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Rol del miembro actualizado correctamente',
    data: {
      member: memberUpdated
    }
  })
}

// Obtener lista de miembros de un workspace
export async function workspaceMemberesList(req, res) {
  const { workspace_id } = req.params;

  const list = await memberRepository.getAllMembershipsByWorkspaceId(workspace_id);

  return res.status(200).json({
    ok: true,
    status: 200,
    message: 'Lista de miembros de un workspace obtenida correctamente',
    data: {
      listMembers: list
    }
  });
}

// Agregar un miembro existente al workspace por email (owner/admin) -->
export async function addMember(req, res) {
  const { workspace_id } = req.params
  const { email, rol = 'user' } = req.body || {}

  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new ServerError('El email del usuario es obligatorio', 400)
  }

  const emailNormalizado = email.trim()

  if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado))) {
    throw new ServerError('El email no tiene un formato valido', 400)
  }

  if (rol !== 'admin' && rol !== 'user') {
    throw new ServerError('Rol invalido para ejecutar esta accion', 400)
  }

  const userExist = await userRepository.getByEmail(emailNormalizado)

  if (!userExist) {
    throw new ServerError('Usuario no encontrado', 404)
  }

  // La alta directa (opción A): se agrega automaticamente,
  // no hay invitación que el usuario deba aceptar
  if (!userExist.emailVerificado) {
    throw new ServerError('El usuario todavía no verificó su email', 400)
  }

  const userWithMembership = await memberRepository.getMembershipByUserAndWorkspace(userExist._id, workspace_id)

  if (userWithMembership) {
    throw new ServerError('El usuario ya pertenece a este espacio de trabajo', 400)
  }

  let memberCreated;
  try {
    memberCreated = await memberRepository.create(userExist._id, workspace_id, rol)
  } catch (error) {
    // Si dos adds pasan al mismo instante, el índice único mata uno; devolvemos 400
    if (error.code === 'E11000' || error.code === 11000) {
      throw new ServerError('El usuario ya pertenece a este espacio de trabajo', 400)
    }
    throw error;
  }

  return res.status(201).json({
    ok: true,
    status: 201,
    message: 'Miembro agregado correctamente',
    data: {
      member: memberCreated
    }
  })
}

/* ------------------------------------------------------------------ */
/* Invitaciones por mail                                               */
/* ------------------------------------------------------------------ */

/*
La invitacion es un JWT firmado (mismo patron que verificacion de email).
No se escribe nada en la base hasta que la persona invitada la acepta, asi
que un invitado pendiente nunca aparece como miembro ni obtiene acceso.
*/
const INVITATION_TYPE = 'workspace_invite'
const INVITATION_TTL = '7d'

function normalizarEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function firmarTokenInvitacion({ workspaceId, email, rol, invitador }) {
  return jwt.sign(
    {
      type: INVITATION_TYPE,
      workspace_id: String(workspaceId),
      email: normalizarEmail(email),
      rol,
      invited_by: invitador.id,
      invited_by_name: invitador.name
    },
    ENVIROMMENT.JWT_SECRET_KEY,
    { expiresIn: INVITATION_TTL }
  )
}

/*
Valida la firma, la expiracion y el tipo del token. Lanza 400 si algo falla.
El claim `type` evita que un token de login o de verificacion sirva aca.
*/
function leerTokenInvitacion(invitation_token) {
  if (!invitation_token || typeof invitation_token !== 'string') {
    throw new ServerError('La invitacion es obligatoria', 400)
  }

  let payload
  try {
    payload = jwt.verify(invitation_token, ENVIROMMENT.JWT_SECRET_KEY)
  } catch (error) {
    throw new ServerError('La invitacion es invalida o expiro', 400)
  }

  if (payload.type !== INVITATION_TYPE) {
    throw new ServerError('La invitacion es invalida o expiro', 400)
  }

  return payload
}

/*
Validaciones comunes a la vista previa y a la aceptacion:
- el token corresponde a este workspace
- quien esta logueado es la persona invitada
- el workspace sigue existiendo
Devuelve el workspace.
*/
async function validarInvitacion(payload, workspace_id, req) {
  if (String(payload.workspace_id) !== String(workspace_id)) {
    throw new ServerError('La invitacion no corresponde a este espacio de trabajo', 400)
  }

  if (normalizarEmail(payload.email) !== normalizarEmail(req.user.email)) {
    throw new ServerError('Esta invitacion fue enviada a otro email', 403)
  }

  const workspace = await workspaceRepository.getByID(workspace_id)

  if (!workspace) {
    throw new ServerError('Workspace no encontrado', 404)
  }

  return workspace
}

/*
POST /api/workspace/:workspace_id/members/invite
Envia el mail de invitacion. No crea la membresia: eso pasa al aceptar.
*/
export async function inviteMember(req, res) {
  const { workspace_id } = req.params
  const { email, rol = 'user' } = req.body || {}

  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new ServerError('El email del usuario es obligatorio', 400)
  }

  const emailNormalizado = email.trim()

  if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado))) {
    throw new ServerError('El email no tiene un formato valido', 400)
  }

  if (rol !== 'admin' && rol !== 'user') {
    throw new ServerError('Rol invalido para ejecutar esta accion', 400)
  }

  const userExist = await userRepository.getByEmail(emailNormalizado)

  if (!userExist) {
    throw new ServerError('Usuario no encontrado', 404)
  }

  if (!userExist.emailVerificado) {
    throw new ServerError('El usuario todavía no verificó su email', 400)
  }

  const userWithMembership = await memberRepository.getMembershipByUserAndWorkspace(userExist._id, workspace_id)

  if (userWithMembership) {
    throw new ServerError('El usuario ya pertenece a este espacio de trabajo', 400)
  }

  const invitation_token = firmarTokenInvitacion({
    workspaceId: workspace_id,
    email: userExist.email,
    rol,
    invitador: { id: req.user.id, name: req.user.name }
  })

  const { subject, html } = workspaceInviteTemplate({
    invitationToken: invitation_token,
    workspaceId: workspace_id,
    workspaceName: req.workspace.name,
    inviterName: req.user.name
  })

  await mailerTransporter.sendMail({
    to: userExist.email,
    from: ENVIROMMENT.GMAIL_USER,
    subject: subject,
    html: html
  })

  return res.status(200).json({
    ok: true,
    status: 200,
    message: `Invitacion enviada a ${userExist.email}`,
    data: {
      email: userExist.email,
      rol: rol
    }
  })
}

/*
GET /api/workspace/:workspace_id/members/invitation?invitation_token=...
Vista previa para la pantalla de aceptacion: quien invito, a que workspace
y con que rol. No tiene efectos secundarios.
*/
export async function getInvitationPreview(req, res) {
  const { workspace_id } = req.params
  const { invitation_token } = req.query

  const payload = leerTokenInvitacion(invitation_token)
  const workspace = await validarInvitacion(payload, workspace_id, req)

  const existing = await memberRepository.getMembershipByUserAndWorkspace(req.user.id, workspace_id)

  return res.status(200).json({
    ok: true,
    status: 200,
    message: 'Invitacion valida',
    data: {
      workspace: {
        _id: workspace._id,
        name: workspace.name
      },
      invited_by: {
        name: payload.invited_by_name || 'Un miembro del espacio'
      },
      invited_email: payload.email,
      rol: payload.rol,
      expires_at: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      already_member: Boolean(existing)
    }
  })
}

/*
POST /api/workspace/:workspace_id/members/accept-invite
Crea la membresia recien cuando la persona invitada acepta.
Es idempotente: si ya es miembro, responde 200 sin duplicar nada.
*/
export async function acceptInvite(req, res) {
  const { workspace_id } = req.params
  const { invitation_token } = req.body || {}

  const payload = leerTokenInvitacion(invitation_token)
  const workspace = await validarInvitacion(payload, workspace_id, req)

  if (payload.rol !== 'admin' && payload.rol !== 'user') {
    throw new ServerError('La invitacion tiene un rol invalido', 400)
  }

  const user = await userRepository.getByEmail(req.user.email)

  if (!user) {
    throw new ServerError('Usuario no encontrado', 404)
  }

  if (!user.emailVerificado) {
    throw new ServerError('El usuario todavía no verificó su email', 400)
  }

  const existing = await memberRepository.getMembershipByUserAndWorkspace(user._id, workspace_id)

  if (existing) {
    return res.status(200).json({
      ok: true,
      status: 200,
      message: 'Ya perteneces a este espacio de trabajo',
      data: {
        workspace: { _id: workspace._id, name: workspace.name },
        member: existing,
        already_member: true
      }
    })
  }

  let memberCreated
  try {
    memberCreated = await memberRepository.create(user._id, workspace_id, payload.rol)
  } catch (error) {
    // Dos aceptaciones al mismo tiempo: el indice unico mata una, la tratamos como idempotente
    if (error.code === 'E11000' || error.code === 11000) {
      const member = await memberRepository.getMembershipByUserAndWorkspace(user._id, workspace_id)
      return res.status(200).json({
        ok: true,
        status: 200,
        message: 'Ya perteneces a este espacio de trabajo',
        data: {
          workspace: { _id: workspace._id, name: workspace.name },
          member: member,
          already_member: true
        }
      })
    }
    throw error
  }

  return res.status(201).json({
    ok: true,
    status: 201,
    message: `Te uniste a ${workspace.name}`,
    data: {
      workspace: { _id: workspace._id, name: workspace.name },
      member: memberCreated,
      already_member: false
    }
  })
}
