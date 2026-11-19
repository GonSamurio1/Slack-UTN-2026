const API_URL = import.meta.env.VITE_APP_URL_BACKEND

/*
Consultas a la API de canales y mensajes de canal.
Todas repiten el mismo patron: fetch con el auth_token en el header,
parse del body y throw Error(message) si el servidor respondio con error.
*/

/*
Obtener la lista de canales de un workspace.
Endpoint: GET /api/workspace/:workspace_id/channels
*/
export async function getChannels(workspace_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`
      },
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Consulta a la API para crear un canal dentro de un workspace.
El nombre no puede repetirse dentro del mismo workspace (el backend lo valida).
Endpoint: POST /api/workspace/:workspace_id/channels
*/
export async function createChannel(workspace_id, name, description) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
        name: name,
        description: description
      })
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Obtener los detalles de un canal especifico (nombre, descripcion).
Endpoint: GET /api/workspace/:workspace_id/channels/:channel_id
*/
export async function getChannelById(workspace_id, channel_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels/' + channel_id,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`
      },
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Obtener los mensajes de un canal (con el emisor poblado, ordenados por fecha).
Endpoint: GET /api/workspace/:workspace_id/channels/:channel_id/messages
*/
export async function getChannelMessages(workspace_id, channel_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels/' + channel_id + '/messages',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth_token}`
      },
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Enviar un mensaje al canal (el emisor es el usuario del token).
Endpoint: POST /api/workspace/:workspace_id/channels/:channel_id/messages
*/
export async function createChannelMessage(workspace_id, channel_id, contenido) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels/' + channel_id + '/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
        contenido: contenido
      })
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Editar un mensaje propio (el backend solo lo permite al autor).
Endpoint: PUT /api/workspace/:workspace_id/channels/:channel_id/messages/:message_id
*/
export async function updateChannelMessage(workspace_id, channel_id, message_id, contenido) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels/' + channel_id + '/messages/' + message_id,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
        contenido: contenido
      })
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}

/*
Eliminar un mensaje propio (el backend tambien lo permite a owner/admin).
Endpoint: DELETE /api/workspace/:workspace_id/channels/:channel_id/messages/:message_id
*/
export async function deleteChannelMessage(workspace_id, channel_id, message_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/channels/' + channel_id + '/messages/' + message_id,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth_token}`
      },
    }
  )

  const response_body = await response_http.json()

  if (!response_body.ok) {
    throw new Error(response_body.message)
  }

  return response_body
}
