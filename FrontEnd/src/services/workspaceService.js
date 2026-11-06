const API_URL = 'http://localhost:8080'

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