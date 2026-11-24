import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import useRequest from '../../hooks/useRequest'
import { getWorkspaceById, updateWorkspace } from '../../services/workspaceService'
import TextField from '../../Components/Form/TextField'
import TextAreaField from '../../Components/Form/TextAreaField'
import Button from '../../Components/Form/Button'
import Alert from '../../Components/Alert/Alert'
import Logo from '../../Components/Logo/Logo'
import '../CreateWorkspaceScreen/CreateWorkspaceScreen.css'
import './EditWorkspaceScreen.css'

const DESCRIPTION_MAX_LENGTH = 1000

/*
Mejora los mensajes del servidor: si el fallo es de red o el servidor
no envio detalle, mostramos un mensaje amigable en lugar del texto crudo.
(Mismo criterio que en CreateWorkspaceScreen.)
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

/*
Formulario de edicion.

Se monta recien cuando el workspace ya se cargo, asi useForm arranca con los
valores actuales (nombre y descripcion) sin necesidad de sincronizar despues.
Conecta con PUT /api/workspace/:workspace_id y al guardar vuelve al detalle,
donde el WorkspaceProvider consulta la API de nuevo y muestra los datos frescos.
*/
function EditWorkspaceForm({ workspace_id, workspace }) {

  const { formState, handleChangeInput } = useForm({
    name: workspace.name || '',
    description: workspace.description || ''
  })

  const { loading, response, error, sendRequest } = useRequest()
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => updateWorkspace(workspace_id, formState.name, formState.description)
    )
  }

  // Si se guardo con exito, volvemos al detalle del workspace
  useEffect(
    () => {
      if (response && !loading) {
        navigate('/workspace/' + workspace_id)
      }
    },
    [response, loading]
  )

  const errorMessage = getErrorMessage(error)

  return (
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
          Guardar cambios
        </Button>
      </form>

      {errorMessage && !loading && (
        <Alert type="error" message={errorMessage} />
      )}

      <Link className="edit-workspace-screen__back" to={'/workspace/' + workspace_id}>
        Volver al espacio de trabajo
      </Link>
    </section>
  )
}

/*
Pantalla para editar el nombre y la descripcion de un workspace
(/workspace/:workspace_id/edit).

Primero hace GET del workspace para precargar el formulario; mientras tanto
muestra el estado de carga y, si falla, un error con la opcion de recargar.
El backend acepta la edicion para owner y admin.
*/
function EditWorkspaceScreen() {

  const { workspace_id } = useParams()

  const { loading, response, error, sendRequest } = useRequest()

  useEffect(
    () => {
      sendRequest(() => getWorkspaceById(workspace_id))
    },
    [workspace_id]
  )

  const workspace = response?.data?.workspace

  return (
    <main className="create-workspace-screen">
      <section className="create-workspace-intro">
        <h1 className="create-workspace-intro__title">
          Editar espacio de trabajo
        </h1>
        <p className="create-workspace-intro__subtitle">
          Cambia el nombre o la descripcion del espacio. Los miembros y los
          canales no se modifican.
        </p>
      </section>

      {!error && !workspace && (
        <section className="create-workspace-card edit-workspace-screen__state">
          <span className="edit-workspace-screen__loader" />
          <p>Cargando espacio de trabajo...</p>
        </section>
      )}

      {!loading && error && (
        <section className="create-workspace-card edit-workspace-screen__state">
          <Alert type="error" message={`Error : ${getErrorMessage(error)}`} />
          <div className="edit-workspace-screen__state-actions">
            <button
              type="button"
              className="edit-workspace-screen__retry"
              onClick={() => sendRequest(() => getWorkspaceById(workspace_id))}
            >
              Recargar
            </button>
            <Link className="edit-workspace-screen__back" to={'/workspace/' + workspace_id}>
              Volver al espacio de trabajo
            </Link>
          </div>
        </section>
      )}

      {!loading && !error && workspace && (
        <EditWorkspaceForm
          key={workspace_id}
          workspace_id={workspace_id}
          workspace={workspace}
        />
      )}
    </main>
  )
}

export default EditWorkspaceScreen
