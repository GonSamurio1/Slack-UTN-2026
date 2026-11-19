const API_URL = import.meta.env.VITE_APP_URL_BACKEND

export async function getAllWorkspaces() {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace',
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
Consulta a la API para crear un nuevo espacio de trabajo
a nombre del usuario autenticado (quedara como owner).
*/
export async function createWorkspace(name, description) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace',
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
Consulta a la API para obtener los detalles de un workspace especifico.
*/
export async function getWorkspaceById(workspace_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id,
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
Consulta a la API para agregar un usuario existente al workspace por email.
El rol permitido por el backend es 'admin' o 'user' (owner/admin pueden invitar).
*/
export async function addWorkspaceMember(workspace_id, email, rol = 'user') {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/members',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
        email: email,
        rol: rol
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
Consulta a la API para obtener la lista de miembros de un workspace.
Se usa para mostrar los avatares y el conteo de miembros en la lista
de espacios de trabajo del HomeScreen.
*/
export async function getWorkspaceMembers(workspace_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/members',
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