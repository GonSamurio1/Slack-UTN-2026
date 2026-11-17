import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { createWorkspace } from '../../services/workspaceService'
import TextField from '../../Components/Form/TextField'
import TextAreaField from '../../Components/Form/TextAreaField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import './CreateWorkspaceScreen.css'

const DESCRIPTION_MAX_LENGTH = 1000

/*
Pantalla para crear un espacio de trabajo: pide nombre (obligatorio) y
descripcion (opcional, hasta 1000 caracteres). Conecta con POST /api/workspace
y al crear con exito redirige al home, donde la lista ya lo muestra.
*/
function CreateWorkspaceScreen() {
  const initial_state = { name: '', description: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => createWorkspace(formState.name, formState.description)
    )
  }

  // Si se creo con exito, volvemos al home con la lista actualizada
  useEffect(
    () => {
      if (response && !loading) {
        navigate('/')
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
    <main className="create-workspace-screen">
      <section className="create-workspace-intro">
        <h1 className="create-workspace-intro__title">
          Asigna un nombre a tu espacio de trabajo de Slack
        </h1>
        <p className="create-workspace-intro__subtitle">
          Elige algo que tu equipo reconozca facilmente, como el nombre de la
          empresa o del equipo. Podes modificarlo cuando quieras.
        </p>
      </section>
      <section className="create-workspace-card">
        <Logo className="create-workspace-card__logo" />
        <form className="create-workspace-card__form" onSubmit={handleSubmit}>
          <TextField
            label="Nombre del espacio de trabajo:"
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
            Crear espacio de trabajo
          </Button>
        </form>
        {errorMessage && !loading && (
          <Alert type="error" message={errorMessage} />
        )}
      </section>
    </main>
  )
}

export default CreateWorkspaceScreen
