import { useNavigate } from 'react-router-dom'
import './LogoutButton.css'

/*
Boton de cierre de sesion: borra el auth_token de localStorage y
redirige al login. El AuthMiddleware (rutas protegidas) redirige al
login por su cuenta si no hay token, asi que con esto alcanza.
*/
export default function LogoutButton() {

  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('auth_token')
    navigate('/login')
  }

  return (
    <button
      type="button"
      className="logout-button"
      onClick={handleLogout}
    >
      Cerrar sesion
    </button>
  )
}
