import React from 'react'
import { Link } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { forgotPassword } from '../../services/authService'
import TextField from '../../Components/Form/TextField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './ForgotPasswordScreen.css'

/*
Pantalla para solicitar el restablecimiento de contraseña.
El usuario ingresa su email y se consulta al endpoint
POST /api/auth/forgot-password del backend. Si la cuenta existe,
el backend le envia un mail con un token para restablecer la contraseña.
*/
function ForgotPasswordScreen() {
  const initial_state = { email: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => forgotPassword(formState.email)
    )
    console.log('Usuario solicita restablecer contraseña', formState)
  }

  /*
    Mejora los mensajes del servidor: si el fallo es de red o el servidor
    no envio detalle, mostramos un mensaje amigable en lugar del texto crudo.
  */
  function getErrorMessage(rawError) {
    if (!rawError) return null
    const networkErrors = ['failed to fetch', 'networkerror', 'load failed']
    const isNetworkError = networkErrors.some(
      (pattern) => rawError.toLowerCase().includes(pattern)
    )
    return isNetworkError
      ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
      : rawError
  }

  const errorMessage = getErrorMessage(error)

  return (
    <main className="forgot-password-screen">
      <section className="forgot-password-intro">
        <h1 className="forgot-password-intro__title">Bienvenido a Slack.</h1>
        <p className="forgot-password-intro__subtitle">
          Te ayudamos a recuperar tu contraseña
        </p>
      </section>
      <section className="forgot-password-card">
        <Logo size={60} className="forgot-password-card__logo" />
        <h2 className="forgot-password-card__title">Olvide mi contraseña</h2>
        <form className="forgot-password-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Email:"
            name="email"
            id="email"
            type="email"
            value={formState.email}
            onChange={handleChangeInput}
          />
          <Button type="submit" loading={loading}>
            Enviar mail
          </Button>
        </form>
        <p className="forgot-password-card__login-hint">
          Ya recordaste tu contraseña?{' '}
          <Link className="forgot-password-card__login-link" to="/login">
            Inicia sesion
          </Link>
        </p>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
        {response && !loading && (
          <Alert
            type="success"
            message="Si tu cuenta existe, te enviamos un mail con los pasos para restablecer tu contraseña. Revisa tu casilla."
          />
        )}
      </section>
    </main>
  )
}

export default ForgotPasswordScreen
