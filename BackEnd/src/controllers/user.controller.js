import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js"


export async function getUsers(req, res) {
  const user_list = await userRepository.getUsers()
  res.status(200).send({
    message: "Get users list",
    ok: true,
    status: 200,
    data: {
      users: user_list
    }
  })
}

export async function getUserById(req, res) {
  const user_id = req.params.user_id
  const user = await userRepository.getById(user_id)

  if (!user) {
    throw new ServerError("User not found", 404)
  }
  return res.status(200).send(
    {
      message: "Get user details successfully",
      status: 200,
      ok: true,
      data: {
        user: user
      }
    }
  )
}