/*
Un repository es donde manejamos la comunicacion con nuestros datos (Generalmente la DB)
 */
import User from "../models/users.model.js";

class UserRepository {

  // USERS -->
  async create(nombre, email, password) {
    const result = await User.create({
      nombre: nombre,
      email: email,
      password: password
    })
    return result
  }

  // ACTUALIZAR USER POR ID -->
  async softUpdateUserById(userId) {
    const result = await User.findByIdAndUpdate(userId, { activo: false })
    console.log(result)
    return result
  }
  //ELIMINAR USER POR ID -->
  async deleteUser(userId) {
    const result = await User.findByIdAndDelete(userId)
    console.log(result)
    return result
  }
  // DEVUELVE UN OBJETO O NULL -->
  async getByEmail(email) {
    const result = await User.findOne({ email: email })
    console.log(result)
    return result
  }
  // FILTRAR POR ID -->
  async getById(userId) {
    const result = await User.findById(userId)
    return result
  }
  // MUESTRA TODOS LOS USUARIOS QUE CUMPLAN CON EL TERMINO DADO -->
  async getBySearchTerm(term) {
    const result = await User.find({
      nombre: {
        $regex: term,
        $options: 'i' //Permite buscar de forma 'no case sensitive'
      },
      activo: true
    })
      .limit(5) //Se le da un limite, maximo hasta 5 usuarios con el mismo termino

    console.log(result)
    return result
  }
  // FILTRA USUARIOS POR SU FECHA DE CRACION (se puede poner un rango de x fecha hasta x fecha) -->
  async getUsersByCreationDate(minDate, maxDate) {
    const result = await User.find({
      // Trae usuarios con una fecha minima de creacion
      fecha_creacion: {
        $gte: new Date(minDate), //Establece una fecha minima
        $lt: new Date(maxDate) // Establece una fecha maxima
      }
    })
    console.log(result)
    return result
  }
  // MUESTRA USUARIOS EN LA DB -->
  async getUsers() {
    const result = await User.find()
    console.log(result)
    return result
  }

  async updateById(userId, update_data) {
    return await User.findByIdAndUpdate(userId, update_data)
  }
}

const userRepository = new UserRepository()
export default userRepository