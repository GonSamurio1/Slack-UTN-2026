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

/*
Consulta a la API para actualizar el nombre y la descripcion de un workspace.
El backend acepta owner y admin. Una descripcion vacia ("") se interpreta
como "no enviar": no borra la descripcion que ya estaba guardada.
*/
export async function updateWorkspace(workspace_id, name, description) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id,
    {
      method: 'PUT',
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
Consulta a la API para eliminar un workspace.
Solo el owner puede hacerlo. El backend borra en cascada las membresias,
los canales y los mensajes de esos canales.
*/
export async function deleteWorkspace(workspace_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id,
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

/*
Consulta a la API para cambiar el rol de un miembro del workspace.
Roles permitidos por el backend: 'user' o 'admin' (nunca 'owner').
Depende del endpoint PUT de miembros, que todavia no existe en el backend.
*/
export async function updateWorkspaceMember(workspace_id, member_id, rol) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/members/' + member_id,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify({
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
Consulta a la API para expulsar a un miembro del workspace.
El backend aplica la jerarquia de roles: no se puede expulsar al owner
y un admin no puede expulsar a otro admin (solo el owner puede).
*/
export async function deleteWorkspaceMember(workspace_id, member_id) {
  const auth_token = localStorage.getItem('auth_token')
  const response_http = await fetch(
    API_URL + '/api/workspace/' + workspace_id + '/members/' + member_id,
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