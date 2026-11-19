import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { createChannel } from '../../services/channelService'
import TextField from '../../Components/Form/TextField'
import TextAreaField from '../../Components/Form/TextAreaField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './CreateChannelScreen.css'

const DESCRIPTION_MAX_LENGTH = 200

/*
Pantalla para crear un canal dentro de un workspace: pide nombre (obligatorio)
y descripcion (opcional, hasta 200 caracteres). Conecta con
POST /api/workspace/:workspace_id/channels y al crear con exito vuelve al
workspace, donde la lista de canales ya lo muestra.
*/
function CreateChannelScreen() {

  const { workspace_id } = useParams()
  const navigate = useNavigate()

  const initial_state = { name: '', description: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => createChannel(workspace_id, formState.name, formState.description)
    )
  }

  // Si se creo con exito, volvemos al workspace con la lista actualizada
  useEffect(
    () => {
      if (response && !loading) {
        navigate(`/workspace/${workspace_id}`)
      }
    },
    [response, loading]
  )

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
    <main className="create-channel-screen">
      <section className="create-channel-intro">
        <h1 className="create-channel-intro__title">
          Crea un canal
        </h1>
        <p className="create-channel-intro__subtitle">
          Los canales organizan las conversaciones por temas. Elegi un nombre
          claro para que tu equipo lo encuentre facil.
        </p>
      </section>
      <section className="create-channel-card">
        <Logo className="create-channel-card__logo" />
        <form className="create-channel-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Nombre del canal:"
            name="name"
            id="name"
            type="text"
            value={formState.name}
            onChange={handleChangeInput}
          />
          <TextAreaField
            label="Descripcion (opcional):"
            name="description"
            id="description"
            value={formState.description}
            onChange={handleChangeInput}
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
          <Button type="submit" loading={loading} disabled={!formState.name.trim()}>
            Crear canal
          </Button>
        </form>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
      </section>
    </main>
  )
}

export default CreateChannelScreen
