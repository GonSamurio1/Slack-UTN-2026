import React from 'react'
import { Link } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { register } from '../../services/authService'
import TextField from '../../Components/Form/TextField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './RegisterScreen.css'

function RegisterScreen() {
  const initial_state = { name: '', email: '', password: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => register(formState.name, formState.email, formState.password)
    )
    console.log('Usuario intenta registrarse', formState)
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
    <main className="register-screen">
      <section className="register-intro">
        <h1 className="register-intro__title">Bienvenido a Slack.</h1>
        <p className="register-intro__subtitle">
          Primero introduce tu correo electronico
        </p>
      </section>
      <section className="register-card">
        <Logo className="register-card__logo" />
        <h2 className="register-card__title">Registro de usuario</h2>
        <form className="register-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Nombre:"
            name="name"
            id="name"
            type="text"
            value={formState.name}
            onChange={handleChangeInput}
          />
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
            Registrarse
          </Button>
        </form>
        <p className="register-card__login-hint">
          Ya tenes una cuenta?{' '}
          <Link className="register-card__login-link" to="/login">
            Inicia sesion
          </Link>
        </p>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
        {response && !loading && (
          <Alert
            type="success"
            message="Registro exitoso, revisa tu correo electronico para verificar la cuenta"
          />
        )}
      </section>
    </main>
  )
}

export default RegisterScreen
