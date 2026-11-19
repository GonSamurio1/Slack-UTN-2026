/*
Datos del usuario autenticado, leidos del auth_token (JWT) guardado en localStorage.

El token tiene la forma header.payload.firma, donde payload es un JSON en base64url
con { id, name, email } (es lo mismo que firma el backend en el login).

Aca solo DECODIFICAMOS el payload (sin verificar la firma, eso lo hace el backend
en cada request). Sirve para que el front sepa quien es el usuario logueado,
por ejemplo para marcar como "propios" sus mensajes en la vista del canal.
*/

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1]
    // base64url -> base64 (atob no acepta '-' ni '_')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/* Devuelve el id del usuario autenticado, o null si no hay token valido */
export function getAuthUserId() {
  const auth_token = localStorage.getItem('auth_token')
  if (!auth_token) return null

  const payload = decodeJwtPayload(auth_token)
  return payload?.id ?? null
}

/* Devuelve el nombre del usuario autenticado, o null si no hay token valido */
export function getAuthUserName() {
  const auth_token = localStorage.getItem('auth_token')
  if (!auth_token) return null

  const payload = decodeJwtPayload(auth_token)
  return payload?.name ?? null
}
