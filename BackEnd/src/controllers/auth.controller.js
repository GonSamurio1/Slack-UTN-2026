import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js"
import { generateHash, compareHash } from "../utils/bcrypt.util.js";
import jwt from 'jsonwebtoken'
import ENVIROMMENT from "../config/enviromment.config.js";
import mailerTransporter from "../config/mailer.config.js";


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

  //Validar si el mail ya esta registrado
  //Respuesta ambigua: no revelamos si el email ya esta registrado (user enumeration)
  const user_already_exist = await userRepository.getByEmail(email)
  if (user_already_exist) {
    //Si la cuenta existe y aun no esta verificada, reenviamos el mail; si ya esta verificada, no hacemos nada.
    //En todos los casos la respuesta es identica.
    if (!user_already_exist.emailVerificado) {
      await sendVerificationEmail(email)
    }
  } else {
    const passwordHash = await generateHash(password)
    await userRepository.create(nombre, email, passwordHash)

    await sendVerificationEmail(email)
  }

  return response.status(201).send({
    ok: true,
    status: 201,
    message: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
  })
}

/*
Genera el token de verificacion y envia el mail con el link
que apunta a la pantalla /verify-email del frontend.
Se reutiliza tanto en el registro como en el reenvio.
*/
async function sendVerificationEmail(email) {
  const verifyEmailToken = jwt.sign
    (
      {
        email: email
      },
      ENVIROMMENT.JWT_SECRET_KEY,
      {
        expiresIn: '24h'
      }
    )

  await mailerTransporter.sendMail({
    to: email,
    from: ENVIROMMENT.GMAIL_USER,
    subject: 'Verifica tu cuenta',
    html: `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header: aubergine Slack -->
              <tr>
                <td align="center" style="background-color: #481A54; padding: 34px 20px 30px;">
                  <!-- Logo trébol de 4 hojas (2x2 con border-radius) -->
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 16px;">
                    <tr>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #36C5F0; border-radius: 50% 50% 0 50%;">&nbsp;</td>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #2EB67D; border-radius: 50% 50% 50% 0;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #E01E5A; border-radius: 50% 0 50% 50%;">&nbsp;</td>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #ECB22E; border-radius: 0 50% 50% 50%;">&nbsp;</td>
                    </tr>
                  </table>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">¡Bienvenido a la plataforma!</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                    Gracias por registrarte. Para completar tu registro y activar tu cuenta, hacé clic en el siguiente botón:
                  </p>
                  <!-- Botón CTA -->
                  <a href="${ENVIROMMENT.URL_FRONTEND}/verify-email?verification_token=${verifyEmailToken}"
                     style="display: inline-block; background-color: #481A54; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 5px rgba(72, 26, 84, 0.4);">
                    Verificar mi cuenta
                  </a>
                  <p style="color: #777777; font-size: 13px; margin-top: 30px; line-height: 1.4;">
                    Si no creaste esta cuenta, podés ignorar este correo de forma segura.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f9fafb; padding: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                  © 2026 GonzaAPP. Todos los derechos reservados.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  })
}

/*
Endpoint para reenviar el mail de verificacion:
GET /api/auth/verify-email/:email/resend
Recibe un email valido, regenera el token y reenvia el mail al usuario.
*/
export async function resendVerificationEmail(req, res) {
  const { email } = req.params

  if (!email || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new ServerError(
      'Email is incorrect',
      400
    )
  }

  const user = await userRepository.getByEmail(email)

  //Respuesta ambigua: no revelamos si la cuenta existe o si ya esta verificada (user enumeration).
  //Solo reenviamos el mail si la cuenta existe y esta pendiente de verificacion; la respuesta es identica en todos los casos.
  if (user && !user.emailVerificado) {
    await sendVerificationEmail(email)
  }

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'Se enviará un mail con los pasos para verificar tu cuenta, en caso de que esta sea real'
  })
}

/*
Encriptamos la password para que en DB se gaurde un dato irreversible
Viendo el dato irreversible es IMPROBABLE que se sepa el dato original
*/


/*
Crear la funcion login(req, res)
Esta funcion debe priemero verificar que por body llegue un mail y una password.
Debe verificar que el mail tenga formato de mail.
Debe buscar por email al usuario y verificar que este exista (Sino decir usuario no econtrado)
Comparar el hash guardado en DB contra la password que nos envio por body el usuario
  - Si es incorrecto decir (400 Credenciales incorrectas)
  - Si es correcto decir (200 Usuasrio autentificado exitosamente)

  Este econtrolador debe estar en el endpoint
  POST /api/auth/login
*/

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ServerError('email and password are required', 400);
    }

    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new ServerError("Email is incorrect", 400);
    }

    const user = await userRepository.getByEmail(email);
    //Respuesta ambigua: mismo mensaje si el email no existe o si la password es incorrecta (user enumeration)
    const invalidCredentialsError = new ServerError('Invalid credentials', 400);
    if (!user) {
      throw invalidCredentialsError;
    }

    const compare = await compareHash(password, user.password);
    if (!compare) {
      throw invalidCredentialsError;
    }

    if (!user.emailVerificado) {
      throw new ServerError('Email not verified', 403);
    }

    /* Crear un token firmado de sesión */
    const authToken = jwt.sign(
      {
        id: user._id,
        name: user.nombre,
        email: user.email
      },
      ENVIROMMENT.JWT_SECRET_KEY // FRIMAMOS CON ESTO
    );

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

/*Cuando un usuario inicia sesion debemos darle una credencial firmada que nos permita indicar quien es ese usuario para que mas adelante el usuairo nos devuelva dicha crendecial y poder confiar  en ella

Para poder crear esta credencia firmada uasmos JWT (JsonWebToken)
Los JWT son objetos de JS (JSON) pasados a string () con una firma
*/

export async function verifyEmail(req, res) {
  /*El token llega por querystring: /verify-email?verification_token=xxxxx */
  const { verification_token: verifyEmailToken } = req.query

  if (!verifyEmailToken) {
    throw new ServerError('Verification token is required', 400)
  }

  // Verificar el token -->
  const { email } = jwt.verify(verifyEmailToken, ENVIROMMENT.JWT_SECRET_KEY)

  const user = await userRepository.getByEmail(email)

  //
  if (!user) {
    throw new ServerError('User not found', 404)
  }

  if (user.emailVerificado) {
    throw new ServerError('Account is alrady verified', 400)
  }

  await userRepository.updateById
    (
      user._id,
      {
        emailVerificado: true
      }
    )

  return res.status(200).send({
    ok: true,
    status: 200,
    message: 'User registred succesfully'
  })
}