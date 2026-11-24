import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useRequest from '../../hooks/useRequest'
import { acceptWorkspaceInvite, getWorkspaceInvitation } from '../../services/workspaceService'
import Logo from '../../Components/Logo/Logo'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import './AcceptInviteScreen.css'

/*
Pantalla a la que llega la persona invitada al hacer clic en el link del mail:
/accept-invite?workspace_id=...&invitation_token=...

Flujo:
  1. Al montar pide la vista previa (GET .../members/invitation) para mostrar
     quien la invito, a que workspace y con que rol.
  2. La persona decide: "Aceptar invitacion" o "Ahora no".
  3. Al aceptar (POST .../members/accept-invite) se crea la membresia.

La ruta vive dentro de AuthMiddleware: para aceptar hay que estar logueado
con el email invitado (el backend lo valida y responde 403 si no coincide).
*/
function AcceptInviteScreen() {
  const [searchParams] = useSearchParams()
  const workspace_id = searchParams.get('workspace_id')
  const invitation_token = searchParams.get('invitation_token')

  const navigate = useNavigate()

  const preview = useRequest()
  const accept = useRequest()

  const [invitation, set_invitation] = useState(null)

  const faltanDatos = !workspace_id || !invitation_token

  useEffect(
    () => {
      if (!faltanDatos) {
        preview.sendRequest(() => getWorkspaceInvitation(workspace_id, invitation_token))
      }
    },
    //Se ejecuta una sola vez al entrar a la pantalla
    []
  )

  useEffect(
    () => {
      if (preview.response && preview.response.data) {
        set_invitation(preview.response.data)
      }
    },
    [preview.response]
  )

  /*
    Mejora los mensajes del servidor: si el fallo es de red, mostramos un
    mensaje amigable en lugar del texto crudo.
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

  const previewError = getErrorMessage(preview.error) || (faltanDatos ? 'El link de la invitacion esta incompleto.' : null)
  const acceptError = getErrorMessage(accept.error)

  const aceptada = accept.response && accept.response.data
  const yaEraMiembro = aceptada && aceptada.already_member

  const roleLabel = invitation && invitation.rol === 'admin' ? 'administrador' : 'miembro'

  const fechaVencimiento = invitation && invitation.expires_at
    ? new Date(invitation.expires_at).toLocaleDateString('es-AR')
    : null

  function handleAceptar() {
    accept.sendRequest(() => acceptWorkspaceInvite(workspace_id, invitation_token))
  }

  function irAlWorkspace() {
    navigate('/workspace/' + workspace_id)
  }

  return (
    <main className="accept-invite-screen">
      <section className="accept-invite-card">
        <Logo size={60} className="accept-invite-card__logo" />

        {previewError ? (
          <>
            <h2 className="accept-invite-card__title">Invitacion no disponible</h2>
            <Alert type="error" message={previewError} />
            <Button type="button" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </>
        ) : aceptada ? (
          <>
            <h2 className="accept-invite-card__title">
              {yaEraMiembro ? 'Ya sos parte' : 'Invitacion aceptada'}
            </h2>
            <Alert type="success" message={accept.response.message} />
            <Button type="button" onClick={irAlWorkspace}>
              Ir al workspace
            </Button>
          </>
        ) : !invitation ? (
          <>
            <h2 className="accept-invite-card__title">Invitacion</h2>
            <p className="accept-invite-card__text">
              Estamos cargando la invitacion, aguarda un momento...
            </p>
            <span className="accept-invite-card__loader" />
          </>
        ) : (
          <>
            <h2 className="accept-invite-card__title">Te invitaron a un espacio de trabajo</h2>

            <p className="accept-invite-card__text">
              <strong>{invitation.invited_by.name}</strong> te invito a unirte a{' '}
              <strong>{invitation.workspace.name}</strong> como{' '}
              <strong>{roleLabel}</strong>.
            </p>

            <p className="accept-invite-card__meta">
              Invitacion enviada a {invitation.invited_email}
              {fechaVencimiento ? ` · Vence el ${fechaVencimiento}` : ''}
            </p>

            {invitation.already_member && (
              <Alert type="info" message="Ya perteneces a este espacio de trabajo." />
            )}

            {acceptError && !accept.loading && (
              <Alert type="error" message={acceptError} />
            )}

            <div className="accept-invite-card__actions">
              <Button
                type="button"
                loading={accept.loading}
                onClick={invitation.already_member ? irAlWorkspace : handleAceptar}
              >
                {invitation.already_member ? 'Ir al workspace' : 'Aceptar invitacion'}
              </Button>
              <button
                type="button"
                className="accept-invite-card__decline"
                onClick={() => navigate('/')}
                disabled={accept.loading}
              >
                Ahora no
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default AcceptInviteScreen
