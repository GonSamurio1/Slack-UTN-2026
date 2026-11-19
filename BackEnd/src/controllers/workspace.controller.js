import workspaceRepository from "../repositories/workspace.repository.js"
import memberRepository from "../repositories/member.repository.js";
import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js";

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

// La descripción es opcional; si se da, debe ser texto no vacío (trim) y no
// puede superar los 1000 caracteres
function validarDescripcionWorkspace(descripcion) {
  if (descripcion === undefined || descripcion === null) {
    return undefined;
  }

  if (typeof descripcion !== 'string') {
    throw new ServerError('La descripción del espacio de trabajo debe ser un texto', 400);
  }

  const descripcionNormalizada = descripcion.trim();

  if (descripcionNormalizada === '') {
    throw new ServerError('La descripción del espacio de trabajo no puede ser vacía', 400);
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

  const workspaceActualizado = await workspaceRepository.updateById(
    workspace_id,
    updateData
  )

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
    throw new ServerError('Solo el propietario del espacio de trabajo puede eliminar adminstradores', 403);
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
