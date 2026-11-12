import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useRequest from '../../hooks/useRequest'
import { verifyEmail } from '../../services/authService'
import Logo from '../../Components/Logo/Logo'
import Alert from '../../Components/Alert/Alert'
import './VerifyEmailScreen.css'

/*
Pantalla a la que llega el usuario al hacer clic en el link del correo.
El token viaja por querystring: /verify-email?verification_token=xxxxx
Al montar la pantalla se envia la consulta a la API con el token,
mientras el usuario ve la interfaz. Si verifica correctamente se
redirecciona a /login.
*/
function VerifyEmailScreen() {
  const [searchParams] = useSearchParams()
  const verification_token = searchParams.get('verification_token')

  const { loading, response, error, sendRequest } = useRequest()
  const navigate = useNavigate()

  useEffect(
    () => {
      if (verification_token) {
        sendRequest(() => verifyEmail(verification_token))
      }
    },
    //Se ejecuta una sola vez al entrar a la pantalla
    []
  )

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

  const errorMessage = getErrorMessage(error) || (!verification_token ? 'No se encontro el token de verificacion en el link.' : null)

  /*
    Si la verificacion fue exitosa, mostramos el mensaje y luego
    redireccionamos al login para que el usuario inicie sesion
  */
  useEffect(
    () => {
      if (response && !loading) {
        const timeout_id = setTimeout(() => navigate('/login'), 2000)
        return () => clearTimeout(timeout_id)
      }
    },
    [response, loading]
  )

  return (
    <main className="verify-email-screen">
      <section className="verify-email-card">
        <Logo size={60} className="verify-email-card__logo" />
        <h2 className="verify-email-card__title">Verificacion de cuenta</h2>

        {loading && (
          <>
            <p className="verify-email-card__text">
              Estamos verificando tu cuenta, aguarda un momento...
            </p>
            <span className="verify-email-card__loader" />
          </>
        )}

        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}

        {response && !loading && (
          <Alert
            type="success"
            message="Cuenta verificada con exito. Te redireccionamos al login..."
          />
        )}
      </section>
    </main>
  )
}

export default VerifyEmailScreen
