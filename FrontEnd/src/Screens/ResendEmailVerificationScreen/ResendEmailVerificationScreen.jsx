import React from 'react'
import { Link } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { resendEmailVerification } from '../../services/authService'
import TextField from '../../Components/Form/TextField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './ResendEmailVerificationScreen.css'

/*
Pantalla para reenviar el mail de verificacion de cuenta.
El usuario ingresa su email y se consulta al endpoint
GET /api/auth/verify-email/:email/resend del backend.
*/
function ResendEmailVerificationScreen() {
  const initial_state = { email: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => resendEmailVerification(formState.email)
    )
    console.log('Usuario solicita reenvio de verificacion', formState)
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
    <main className="resend-email-screen">
      <section className="resend-email-intro">
        <h1 className="resend-email-intro__title">Bienvenido a Slack.</h1>
        <p className="resend-email-intro__subtitle">
          Te enviamos de nuevo el mail de verificacion
        </p>
      </section>
      <section className="resend-email-card">
        <Logo size={60} className="resend-email-card__logo" />
        <h2 className="resend-email-card__title">Reenviar verificacion</h2>
        <form className="resend-email-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Email:"
            name="email"
            id="email"
            type="email"
            value={formState.email}
            onChange={handleChangeInput}
          />
          <Button type="submit" loading={loading}>
            Reenviar mail
          </Button>
        </form>
        <p className="resend-email-card__login-hint">
          Ya verificaste tu cuenta?{' '}
          <Link className="resend-email-card__login-link" to="/login">
            Inicia sesion
          </Link>
        </p>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
        {response && !loading && (
          <Alert
            type="success"
            message="Mail de verificacion enviado. Revisa tu casilla para activar la cuenta"
          />
        )}
      </section>
    </main>
  )
}

export default ResendEmailVerificationScreen
