import React, { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { resetPassword } from '../../services/authService'
import TextField from '../../Components/Form/TextField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './ResetPasswordScreen.css'

/*
Pantalla a la que llega el usuario al hacer clic en el link del correo de
restablecimiento. El token viaja por querystring: /reset-password?reset_token=xxxxx
El usuario ingresa la nueva contraseña dos veces (deben coincidir) y al
enviar se consulta al endpoint POST /api/auth/reset-password del backend.
*/
function ResetPasswordScreen() {
  const [searchParams] = useSearchParams()
  const reset_token = searchParams.get('reset_token')

  const initial_state = { password: '', confirmPassword: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()

    // Validacion del lado del cliente antes de consultar a la API
    sendRequest(
      () => {
        if (formState.password !== formState.confirmPassword) {
          throw new Error('Las contraseñas no coinciden')
        }
        return resetPassword(reset_token, formState.password)
      }
    )
    console.log('Usuario intenta restablecer su contraseña')
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

  const errorMessage =
    getErrorMessage(error) ||
    (!reset_token ? 'No se encontro el token de restablecimiento en el link.' : null)

  /*
    Si el restablecimiento fue exitoso, mostramos el mensaje y luego
    redireccionamos al login para que el usuario inicie sesion
  */
  useEffect(
    () => {
      if (response && !loading) {
        const timeout_id = setTimeout(() => navigate('/login'), 2500)
        return () => clearTimeout(timeout_id)
      }
    },
    [response, loading]
  )

  return (
    <main className="reset-password-screen">
      <section className="reset-password-intro">
        <h1 className="reset-password-intro__title">Bienvenido a Slack.</h1>
        <p className="reset-password-intro__subtitle">
          Elegi una nueva contraseña para tu cuenta
        </p>
      </section>
      <section className="reset-password-card">
        <Logo size={60} className="reset-password-card__logo" />
        <h2 className="reset-password-card__title">Restablecer contraseña</h2>
        <form className="reset-password-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Nueva contraseña:"
            name="password"
            id="password"
            type="password"
            value={formState.password}
            onChange={handleChangeInput}
          />
          <TextField
            label="Confirmar contraseña:"
            name="confirmPassword"
            id="confirmPassword"
            type="password"
            value={formState.confirmPassword}
            onChange={handleChangeInput}
          />
          <Button type="submit" loading={loading}>
            Restablecer contraseña
          </Button>
        </form>
        <p className="reset-password-card__login-hint">
          Ya restableciste tu contraseña?{' '}
          <Link className="reset-password-card__login-link" to="/login">
            Inicia sesion
          </Link>
        </p>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
        {response && !loading && (
          <Alert
            type="success"
            message="Contrasenia restablecida con exito. Te redireccionamos al login..."
          />
        )}
      </section>
    </main>
  )
}

export default ResetPasswordScreen
