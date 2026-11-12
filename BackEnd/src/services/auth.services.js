/*
Capa de servicios del modulo de autenticacion.
Aca vive la logica de negocio de cada endpoint: los controllers solo
extraen los datos del request HTTP, llaman a estos servicios y arman la respuesta.

Responsabilidades por servicio:
  - register: verifica si el usuario ya existe, lo crea con password hasheada y envia el mail de verificacion
  - resendVerificationEmail: regenera el token y reenvia el mail de verificacion
  - login: verifica el usuario, compara la contraseña y crea el token de acceso
  - verifyEmail: valida el token de verificacion y marca la cuenta como verificada
  - forgotPassword: envia el mail con el token para restablecer la contraseña (si la cuenta existe)
  - resetPassword: valida el token de restablecimiento y guarda la nueva password hasheada
*/
import userRepository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js"
import { generateHash, compareHash } from "../utils/bcrypt.util.js"
import jwt from 'jsonwebtoken'
import ENVIROMMENT from "../config/enviromment.config.js"
import mailerTransporter from "../config/mailer.config.js"
import { verifyEmailTemplate } from "../utils/email-templates/verify-email.template.js"
import { resetPasswordTemplate } from "../utils/email-templates/reset-password.template.js"

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

  const { subject, html } = verifyEmailTemplate(verifyEmailToken)

  await mailerTransporter.sendMail({
    to: email,
    from: ENVIROMMENT.GMAIL_USER,
    subject: subject,
    html: html
  })
}

/*
Registro de usuario.
Respuesta ambigua: no revelamos si el email ya esta registrado (user enumeration).
  - Si la cuenta no existe: se crea con la password hasheada y se envia el mail de verificacion.
  - Si la cuenta existe y aun no esta verificada: se reenvia el mail de verificacion.
  - Si la cuenta existe y ya esta verificada: no se hace nada.
En todos los casos la respuesta del endpoint es identica.
*/
export async function register(nombre, email, password) {
  const user_already_exist = await userRepository.getByEmail(email)

  if (user_already_exist) {
    //Si la cuenta existe y aun no esta verificada, reenviamos el mail; si ya esta verificada, no hacemos nada.
    if (!user_already_exist.emailVerificado) {
      await sendVerificationEmail(email)
    }
  } else {
    /*
    Encriptamos la password para que en DB se guarde un dato irreversible
    Viendo el dato irreversible es IMPROBABLE que se sepa el dato original
    */
    const passwordHash = await generateHash(password)
    await userRepository.create(nombre, email, passwordHash)

    await sendVerificationEmail(email)
  }
}

/*
Reenvio del mail de verificacion.
Respuesta ambigua: no revelamos si la cuenta existe o si ya esta verificada (user enumeration).
Solo reenviamos el mail si la cuenta existe y esta pendiente de verificacion.
*/
export async function resendVerificationEmail(email) {
  const user = await userRepository.getByEmail(email)

  if (user && !user.emailVerificado) {
    await sendVerificationEmail(email)
  }
}

/*
Login.
Verifica que el usuario exista, compara la contraseña contra el hash guardado en DB,
valida que la cuenta este verificada y crea el token firmado de sesion (JWT).
Devuelve el authToken, o lanza ServerError si algo falla.
*/
export async function login(email, password) {
  const user = await userRepository.getByEmail(email)

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

  /*
  Cuando un usuario inicia sesion debemos darle una credencial firmada que nos permita indicar quien es ese usuario para que mas adelante el usuario nos devuelva dicha credencial y podamos confiar en ella.
  Para poder crear esta credencial firmada usamos JWT (JsonWebToken): objetos de JS (JSON) pasados a string con una firma.
  */
  const authToken = jwt.sign(
    {
      id: user._id,
      name: user.nombre,
      email: user.email
    },
    ENVIROMMENT.JWT_SECRET_KEY // FIRMAMOS CON ESTO
  );

  return authToken
}

/*
Verificacion de cuenta.
Valida el token firmado (generado al enviar el mail), busca al usuario y
marca su cuenta como verificada. Lanza ServerError si el token es invalido,
el usuario no existe o la cuenta ya estaba verificada.
*/
export async function verifyEmail(verifyEmailToken) {
  // Verificar el token: jwt.verify lanza un error si es invalido o expiro
  const { email } = jwt.verify(verifyEmailToken, ENVIROMMENT.JWT_SECRET_KEY)

  const user = await userRepository.getByEmail(email)

  if (!user) {
    throw new ServerError('User not found', 404)
  }

  if (user.emailVerificado) {
    throw new ServerError('Account is already verified', 400)
  }

  await userRepository.updateById
    (
      user._id,
      {
        emailVerificado: true
      }
    )
}

/*
Genera el token de restablecimiento y envia el mail con el link
que apunta a la pantalla /reset-password del frontend.
El token expira en 1 hora por seguridad.
*/
async function sendPasswordResetEmail(email) {
  const resetPasswordToken = jwt.sign
    (
      {
        email: email
      },
      ENVIROMMENT.JWT_SECRET_KEY,
      {
        expiresIn: '1h'
      }
    )

  const { subject, html } = resetPasswordTemplate(resetPasswordToken)

  await mailerTransporter.sendMail({
    to: email,
    from: ENVIROMMENT.GMAIL_USER,
    subject: subject,
    html: html
  })
}

/*
Solicitud de restablecimiento de contraseña.
Respuesta ambigua: no revelamos si el email esta registrado (user enumeration).
Solo enviamos el mail con el token si la cuenta existe.
*/
export async function forgotPassword(email) {
  const user = await userRepository.getByEmail(email)

  if (user) {
    await sendPasswordResetEmail(email)
  }
}

/*
Restablecimiento de contraseña.
Valida el token firmado que llego por mail (expira en 1 hora), busca al usuario
y guarda la nueva password hasheada. Lanza ServerError si el token es invalido,
expiro, o el usuario no existe.
*/
export async function resetPassword(resetPasswordToken, password) {
  try {
    // jwt.verify lanza un error si el token es invalido o expiro
    var { email } = jwt.verify(resetPasswordToken, ENVIROMMENT.JWT_SECRET_KEY)
  } catch (error) {
    throw new ServerError('Reset token is invalid or expired', 400)
  }

  const user = await userRepository.getByEmail(email)

  if (!user) {
    throw new ServerError('User not found', 404)
  }

  /*
  Encriptamos la password para que en DB se guarde un dato irreversible
  Viendo el dato irreversible es IMPROBABLE que se sepa el dato original
  */
  const passwordHash = await generateHash(password)
  await userRepository.updateById
    (
      user._id,
      {
        password: passwordHash
      }
    )
}
