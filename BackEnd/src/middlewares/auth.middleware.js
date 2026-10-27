import jwt from 'jsonwebtoken'
import ENVIROMMENT from '../config/enviromment.config.js'
import ServerError from '../utils/error.util.js'

function authMiddleware(req, res, next) {

  try {
    /*Cuando un usuario haga alguna opereacion que necesite auth:
      - Crear un espacio de trabajo
      - Crear un mensaje

    Vamos a recibir de los header de la consulta el auth token, lo solemos esperar en un headear llamado authorization, pero podes cambiarlo
    */
    const autHeader = req.headers.authorization // 'Bearer token_value'

    if (!autHeader) {
      throw new ServerError('Auth header is required', 400)
    }
    const authToken = autHeader.split(' ')[1] //['Bearer', token_value], el [1] nos trae el valor del token

    if (!authToken) {
      throw new ServerError('Auth token is required', 400)
    }

    // Verificamos la firma para ver si coinciden
    // Si todo sale bien podemos ller el contenido que dejamo en ese token
    const { id, name, email } = jwt.verify(authToken, ENVIROMMENT.JWT_SECRET_KEY)

    // Mutamos la request para que ahora guarde dentro del anueva propiedad user los datos de la credencial
    req.user = {
      id: id,
      name: name,
      email: email
    }
    return next()

  } catch (error) {
    // Si hubo un fallo al verifacr el token
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.NotBeforeError || error instanceof jwt.TokenExpiredError) {

      return res.status(401).send({
        ok: false,
        status: 401,
        message: 'Auth token is invalid!'
      })
    }
    return next(error)
  }
}

export default authMiddleware