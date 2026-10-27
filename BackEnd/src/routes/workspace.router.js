import express from 'express'

// Import funciones de controllers -->
import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspaceById, deleteWorkspaceById, deleteMemberByRole, workspaceMemberesList } from '../controllers/workspace.controller.js'

// Import Middlewares -->
import authMiddleware from '../middlewares/auth.middleware.js'
import workspaceMiddleware from '../middlewares/workspace.middleware.js'

const workspaceRouter = express.Router()

// Crear Workspace (Cualquier user autenticado) -->
workspaceRouter.post('/', authMiddleware, createWorkspace);

// Obtener todos los Worksapces del usaurio -->
workspaceRouter.get('/', authMiddleware, getUserWorkspaces);

// Obtener la lista de miembros de un workspace (Cualquier miembro del workspace) -->
workspaceRouter.get('/:workspace_id/members', authMiddleware, workspaceMiddleware([]), workspaceMemberesList)

// Obtener detalles de un Workspces especifico (Cualquier miembro del workspace) -->
workspaceRouter.get('/:workspace_id', authMiddleware, workspaceMiddleware([]), getWorkspaceById);

// Actualizar Workspace (Solo owner y admin) -->
workspaceRouter.put('/:workspace_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), updateWorkspaceById,);

// Eliminar  Workspace (Solo owner) -->
workspaceRouter.delete('/:workspace_id', authMiddleware, workspaceMiddleware(['owner']), deleteWorkspaceById);

// Borrar miembro (Solo Owner y admin) -->
workspaceRouter.delete('/:workspace_id/members/:member_id', authMiddleware, workspaceMiddleware(['owner', 'admin']), deleteMemberByRole)

// Enviar invitacion a un nuevo miembro (todavia no se llego ahi) -->
//workspaceRouter('/:worksapce_id/members/invite')

// Aceptar invitacion (todavia no se llego ahi) -->
//workspaceRouter('/:workspace_id/members/accept-invite/:invitation_token')

export default workspaceRouter