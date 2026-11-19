import { useEffect, useState } from 'react'
import { useMemberList } from '../../Contexts/WorkspaceContext'
import useRequest from '../../hooks/useRequest'
import { addWorkspaceMember } from '../../services/workspaceService'
import Alert from '../Alert/Alert'
import Button from '../Form/Button'
import './AddMember.css'

/*
Boton "Add member" del sidebar (segun el prototipo).

Al hacer clic despliega un formulario inline con email y rol. El backend
valida que el usuario exista y que no sea ya miembro del workspace.
Al agregarlo bien, se limpia el formulario y se recarga la lista de miembros
(reloadWorkspace del WorkspaceContext).
*/
const ROLE_OPTIONS = [
  { value: 'user', label: 'Miembro' },
  { value: 'admin', label: 'Administrador' }
]

export default function AddMember() {

  const { workspace_id, reloadWorkspace } = useMemberList()

  const [abierto, set_abierto] = useState(false)
  const [email, set_email] = useState('')
  const [rol, set_rol] = useState('user')
  const [success_message, set_success_message] = useState(null)

  const { loading, response, error, sendRequest } = useRequest()

  // Cuando el alta sale bien: limpiar el formulario y refrescar miembros
  useEffect(
    () => {
      if (response) {
        set_email('')
        set_rol('user')
        set_success_message(response.message)
        reloadWorkspace()
      }
    },
    [response]
  )

  function handleSubmit(event) {
    event.preventDefault()

    const value = email.trim()
    if (!value) return

    set_success_message(null)
    sendRequest(() => addWorkspaceMember(workspace_id, value, rol))
  }

  function abrirFormulario() {
    set_success_message(null)
    set_abierto(true)
  }

  function cerrarFormulario() {
    set_email('')
    set_rol('user')
    set_success_message(null)
    set_abierto(false)
  }

  if (!abierto) {
    return (
      <div className="add-member">
        <Button type="button" onClick={abrirFormulario}>
          Add member
        </Button>
      </div>
    )
  }

  return (
    <form className="add-member add-member--open" onSubmit={handleSubmit}>
      <h3 className="add-member__title">Agregar miembro</h3>

      <label className="add-member__label" htmlFor="add-member-email">
        Email
      </label>
      <input
        className="add-member__input"
        id="add-member-email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => set_email(event.target.value)}
        placeholder="usuario@mail.com"
        autoComplete="off"
        disabled={loading}
        required
      />

      <label className="add-member__label" htmlFor="add-member-rol">
        Rol
      </label>
      <select
        className="add-member__input"
        id="add-member-rol"
        name="rol"
        value={rol}
        onChange={(event) => set_rol(event.target.value)}
        disabled={loading}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && !loading && <Alert type="error" message={error} />}
      {success_message && <Alert type="success" message={success_message} />}

      <div className="add-member__actions">
        <Button type="submit" loading={loading} disabled={!email.trim()}>
          Agregar
        </Button>
        <button
          type="button"
          className="add-member__cancel"
          onClick={cerrarFormulario}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
