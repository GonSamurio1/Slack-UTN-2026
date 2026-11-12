/*
Interaccion con la API
*/
const API_URL = import.meta.env.VITE_APP_URL_BACKEND

export async function login(email, password) {
  const response_http = await fetch(
    API_URL + '/api/auth/login',
    {
      method: 'POST',
      headers: {
        //Le decimos al servidor que tipo de dato estamos enviando
        'Content-Type': "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    }
  )

  //Leemos el cuerpo de la respuesta como un JSON
  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
JSON.stringify sirve para transformar un Objeto de JS en un JSON
*/

export async function register(nombre, email, password) {
  const response_http = await fetch(
    API_URL + '/api/auth/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({
        nombre: nombre,
        email: email,
        password: password
      })
    }
  )
  //Leemos el cuerpo de la respuesta como un JSON
  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }
  return response_body
}

/*
Consulta a la API para reenviar el mail de verificacion
de la cuenta a un email registrado y aun no verificado
*/
export async function resendEmailVerification(email) {
  const response_http = await fetch(
    API_URL + '/api/auth/verify-email/' + encodeURIComponent(email) + '/resend'
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }
  return response_body
}

/*
Consulta a la API para verificar la cuenta del usuario mediante el token
que llega por querystring desde el link del correo electronico
*/
export async function verifyEmail(verification_token) {
  const response_http = await fetch(
    API_URL + '/api/auth/verify-email?verification_token=' + encodeURIComponent(verification_token)
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }
  return response_body
}