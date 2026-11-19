import workspaceRepository from "../repositories/workspace.repository.js"
import memberRepository from "../repositories/member.repository.js";
import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js";

// Crear un nuevo workspace -->
export async function createWorkspace(req, res) {
  const { name, description } = req.body || {};

  if (!name) {
    throw new ServerError("El nombre del espacio de trabajo es obligatorio", 400);
  }

  const workspaceCreated = await workspaceRepository.createWorkSpace(name, description);

  const membership = await memberRepository.create(
    req.user.id,
    workspaceCreated._id,
    'owner'
  );

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

  const workspaceActualizado = await workspaceRepository.updateById(
    workspace_id,
    { name, description }
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

// Eliminar un Workspace por ID -->
export async function deleteWorkspaceById(req, res) {
  const { workspace_id } = req.params

  const worksapceDeleted = await workspaceRepository.deleteById(workspace_id)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Espacio de trabajo eliminado',
    data: {
      workspaceDelete: worksapceDeleted
    }
  })
}

// Eliminar un miembro de un Workspace por ID -->
export async function deleteMemberByRole(req, res) {
  const { workspace_id, member_id } = req.params

  const memberDeletd = await memberRepository.deleteById(member_id, workspace_id)

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

  const userWithMembership = await memberRepository.getMembershipByUserAndWorkspace(userExist._id, workspace_id)

  if (userWithMembership) {
    throw new ServerError('El usuario ya pertenece a este espacio de trabajo', 400)
  }

  const memberCreated = await memberRepository.create(userExist._id, workspace_id, rol)

  return res.status(201).json({
    ok: true,
    status: 201,
    message: 'Miembro agregado correctamente',
    data: {
      member: memberCreated
    }
  })
}
