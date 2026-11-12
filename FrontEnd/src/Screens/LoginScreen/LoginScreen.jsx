import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import { login } from '../../services/authService'
import useRequest from '../../hooks/useRequest'
import TextField from '../../Components/Form/TextField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './LoginScreen.css'

function LoginScreen() {

  const initial_state = { email: '', password: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  const navigate = useNavigate()


  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => login(formState.email, formState.password)
    )
    console.log('Usuario intenta iniciar sesion', formState)
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

  /* Los efectos sirven para controlar la recarha/ejecucion de una funcion, cuando la response cambie/llegue:
    -voy a reidreccionar a /home
    -Guaradar en localstorage el auth_token (para poder seguir usandolo)

  */
  useEffect(
    () => {
      if (response && response.data) {
        //console.log('Respuesta del back:', response)
        localStorage.setItem('auth_token', response.data.authToken)
        navigate('/')
      }
    },
    [response]
  )

  return (
    <main className="login-screen">
      <section className="login-intro">
        <h1 className="login-intro__title">Bienvenido a Slack.</h1>
        <p className="login-intro__subtitle">
          Inicia sesion con tu cuenta para continuar
        </p>
      </section>
      <section className="login-card">
        <Logo size={60} className="login-card__logo" />
        <h2 className="login-card__title">Iniciar sesion</h2>
        <form className="login-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Email:"
            name="email"
            id="email"
            type="email"
            value={formState.email}
            onChange={handleChangeInput}
          />
          <TextField
            label="Password:"
            name="password"
            id="password"
            type="password"
            value={formState.password}
            onChange={handleChangeInput}
          />
          <Button type="submit" loading={loading}>
            Iniciar sesion
          </Button>
        </form>
        <p className="login-card__register-hint">
          No tenes una cuenta?{' '}
          <Link className="login-card__register-link" to="/register">
            Registrate
          </Link>
        </p>
        <p className="login-card__register-hint">
          No recibiste el mail de verificacion?{' '}
          <Link className="login-card__register-link" to="/resend-email-verification">
            Reenviar
          </Link>
        </p>
        <p className="login-card__register-hint">
          Olvidaste tu contraseña?{' '}
          <Link className="login-card__register-link" to="/forgot-password">
            Olvide mi contraseña
          </Link>
        </p>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
      </section>
    </main>
  )
}

export default LoginScreen
