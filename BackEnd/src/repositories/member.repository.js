import Member from "../models/member.model.js";

class MemberRepository {
  async create(idUser, workspaceId, role) {
    return await Member.create({
      id_usuario: idUser,
      espacio_trabajo: workspaceId,
      rol: role,
      // El alta es directa (no hay invitacion pendiente que aceptar)
      invitacion_aceptada: true
    });
  }

  async deleteById(memberId, workspaceId) {
    return await Member.findOneAndDelete({ _id: memberId, espacio_trabajo: workspaceId });
  }

  // Busca una membresía por su _id filtrando por workspace -->
  async getByIdAndWorkspace(memberId, workspaceId) {
    return await Member.findOne({ _id: memberId, espacio_trabajo: workspaceId });
  }

  // Elimina todas las membresías de un workspace -->
  async deleteManyByWorkspaceId(workspaceId) {
    return await Member.deleteMany({ espacio_trabajo: workspaceId });
  }

  async updateRoleById(id, role) {
    return await Member.findByIdAndUpdate(
      id,
      { rol: role },
      {
        returnDocument: 'after',
        runValidators: true
      }
    );
  }

  async getAllWorkspaceByUserId(user_id) {
    // 1. Buscamos las membresías del usuario
    const result = await Member
      .find({ id_usuario: user_id /*, invitacion_aceptada: true*/ })
      .select('rol fecha_creacion espacio_trabajo')
      .populate('espacio_trabajo', 'name fecha_creacion');

    // 2. Mapeamos las membresías
    return result.map((membership) => {
      return {
        member_id: membership._id,
        member_rol: membership.rol,
        workspace_id: membership.espacio_trabajo?._id,
        workspace_nombre: membership.espacio_trabajo?.name,
        workspace_fecha_creacion: membership.espacio_trabajo?.fecha_creacion
      };
    });
  }

  async getAllMembershipsByWorkspaceId(workspaceId) {
    const result = await Member.find({ espacio_trabajo: workspaceId })
      .populate('id_usuario', 'nombre email')
    return result

  }

  async getMembershipByUserAndWorkspace(userId, workspace_id) {
    return await Member.findOne
      (
        {
          id_usuario: userId,
          espacio_trabajo: workspace_id
        }
      )
  }
}

const memberRepository = new MemberRepository();
export default memberRepository;
