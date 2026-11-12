import ServerError from "../utils/error.util.js"
import {
  register as registerService,
  resendVerificationEmail as resendVerificationEmailService,
  login as loginService,
  verifyEmail as verifyEmailService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService
} from "../services/auth.services.js"


/*
Los controllers se encargan de la capa HTTP: extraen los datos del request,
validan el formato de lo que llega y delegan la logica de negocio a la capa
de servicios (src/services). Luego arman y devuelven la respuesta HTTP.
*/

/*
Para enviar en una request HTTP info a una API usamos el body

Las consultas (request) tipo GET NO TIENEN body
El body puede ser de distintos tipos de dato:
    Hoy vamos a usar JSON, para poder usar JSON nuestra API debe estar preparada para recibir ese tipo de informacion
*/

export async function register(request, response) {

  console.log("[REGISTER]", request.body)
  const { nombre, email, password } = request.body

  if (!nombre || !email || !password) {
    throw new ServerError(
      "Email, password and nombre is required",
      400
    )
  }

  if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ServerError(
      "Email is incorrect",
      400
    )
  }

  // La logica de negocio (crear el usuario y enviar el mail) vive en la capa de servicios
  await registerService(nombre, email, password)

  return response.status(201).send({
    ok: true,
    status: 201,
    message: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
  })
}

/*
Endpoint para reenviar el mail de verificacion:
GET /api/auth/verify-email/:email/resend
Recibe un email valido y delega el reenvio a la capa de servicios.
*/
export async function resendVerificationEmail(req, res) {
  const { email } = req.params

  if (!email || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ServerError(
      'Email is incorrect',
      400
    )
  }

  await resendVerificationEmailService(email)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
  })
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ServerError('email and password are required', 400);
    }

    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new ServerError("Email is incorrect", 400);
    }

    // El servicio verifica el usuario, compara la contraseña y crea el token de acceso
    const authToken = await loginService(email, password);

    return res.status(200).send({
      ok: true,
      status: 200,
      message: 'User authenticated succesfully',
      data: {
        authToken
      }
    });
  } catch (error) {
    next(error); // Se lo deriva a errorHandlerMiddleware
  }
}

export async function verifyEmail(req, res) {
  /*El token llega por querystring: /verify-email?verification_token=xxxxx */
  const { verification_token: verifyEmailToken } = req.query

  if (!verifyEmailToken) {
    throw new ServerError('Verification token is required', 400)
  }

  // El servicio valida el token y marca la cuenta como verificada
  await verifyEmailService(verifyEmailToken)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'User registred succesfully'
  })
}

/*
Endpoint para solicitar el restablecimiento de contraseña:
POST /api/auth/forgot-password
Recibe un email por body y delega el envio del mail con el token a la capa de servicios.
Respuesta ambigua: no revelamos si el email esta registrado (user enumeration).
*/
export async function forgotPassword(req, res) {
  const { email } = req.body

  if (!email) {
    throw new ServerError('Email is required', 400)
  }

  if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ServerError('Email is incorrect', 400)
  }

  await forgotPasswordService(email)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Se enviará un mail con los pasos para restablecer tu contraseña, en caso de que esta sea real'
  })
}

/*
Endpoint para restablecer la contraseña:
POST /api/auth/reset-password
Recibe por body el token que llego por mail (querystring del link) y la nueva password.
Delega la validacion del token y el guardado de la password a la capa de servicios.
*/
export async function resetPassword(req, res) {
  const { reset_token, password } = req.body

  if (!reset_token || !password) {
    throw new ServerError('Reset token and password are required', 400)
  }

  await resetPasswordService(reset_token, password)

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Password restablecida con exito. Ya podes iniciar sesion con tu nueva contraseña'
  })
}
