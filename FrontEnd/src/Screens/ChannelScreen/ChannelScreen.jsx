import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChannelProvider, useChannel, useChannelContext } from '../../Contexts/ChannelContext'
import MessageList from '../../Components/MessageList/MessageList'
import Alert from '../../Components/Alert/Alert'
import Button from '../../Components/Form/Button'
import useRequest from '../../hooks/useRequest'
import { createChannelMessage } from '../../services/channelService'
import './ChannelScreen.css'

/*
Pantalla del canal (/workspace/:workspace_id/channel/:channel_id).

Layout tipo chat (siguiendo el prototipo de referencias):
  - Header: volver al workspace, "# nombre-del-canal" y su descripcion (useChannel)
  - Lista de mensajes (MessageList, usa useChannelMessages)
  - Barra de envio: input + boton Enviar (POST messages, luego recarga la lista)

Los datos vienen del ChannelContext (montado por el provider de abajo),
que consulta ambas APIs cuando cambia el channel_id de la URL.
*/

/*
Barra de envio de mensajes.
Patron igual al LoginScreen: useRequest para la llamada y un useEffect
que reacciona a la respuesta exitosa (limpia el input y recarga los mensajes).
*/
function MessageForm() {

  const { workspace_id, channel_id, reloadChannelMessages } = useChannelContext()

  const [contenido, set_contenido] = useState('')
  const { loading, response, error, sendRequest } = useRequest()

  async function handleSubmit(event) {
    event.preventDefault()

    const value = contenido.trim()
    if (!value) return

    sendRequest(() => createChannelMessage(workspace_id, channel_id, value))
  }

  // Cuando el mensaje se envia bien: limpiar el input y recargar la lista
  useEffect(
    () => {
      if (response) {
        set_contenido('')
        reloadChannelMessages()
      }
    },
    [response]
  )

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      {error && !loading && (
        <Alert type="error" message={error} />
      )}
      <div className="message-form__row">
        <input
          className="message-form__input"
          name="contenido"
          type="text"
          placeholder="Escribi un mensaje..."
          value={contenido}
          onChange={(event) => set_contenido(event.target.value)}
          maxLength={2000}
          disabled={loading}
          autoComplete="off"
        />
        <Button type="submit" loading={loading} disabled={!contenido.trim()}>
          Enviar
        </Button>
      </div>
    </form>
  )
}

function ChannelScreenContent() {

  const {
    workspace_id,
    channel_loading,
    channel_response,
    channel_error,
    reloadChannel
  } = useChannel()

  if (channel_loading) {
    return (
      <div className="channel-screen channel-screen--loading">
        <span className="channel-screen__loader" />
        <p>Cargando canal...</p>
      </div>
    )
  }

  if (channel_error) {
    return (
      <div className="channel-screen channel-screen--error">
        <Alert type="error" message={`Error : ${channel_error}`} />
        <div className="channel-screen__error-actions">
          <button className="channel-screen__retry" onClick={reloadChannel}>Recargar</button>
          <Link className="channel-screen__back" to={`/workspace/${workspace_id}`}>Volver al workspace</Link>
        </div>
      </div>
    )
  }

  if (!channel_response) {
    return (
      <div className="channel-screen channel-screen--error">
        <Alert type="error" message="Error : Ocurrio un problema al obtener el canal" />
        <div className="channel-screen__error-actions">
          <button className="channel-screen__retry" onClick={reloadChannel}>Recargar</button>
          <Link className="channel-screen__back" to={`/workspace/${workspace_id}`}>Volver al workspace</Link>
        </div>
      </div>
    )
  }

  const channel = channel_response.data.channel

  return (
    <div className="channel-screen">
      {/* Header: nombre y descripcion del canal */}
      <header className="channel-screen__header">
        <Link className="channel-screen__back" to={`/workspace/${workspace_id}`}>
          <span className="channel-screen__back-arrow" aria-hidden="true">←</span>
          Workspace
        </Link>
        <div className="channel-screen__header-info">
          <h1 className="channel-screen__name">
            <span className="channel-screen__hash" aria-hidden="true">#</span>
            {channel.nombre}
          </h1>
          {channel.descripcion && (
            <p className="channel-screen__description">{channel.descripcion}</p>
          )}
        </div>
      </header>

      {/* Lista de mensajes (scrolleable) */}
      <div className="channel-screen__messages">
        <MessageList />
      </div>

      {/* Barra de envio */}
      <MessageForm />
    </div>
  )
}

export default function ChannelScreen() {
  return (
    <ChannelProvider>
      <ChannelScreenContent />
    </ChannelProvider>
  )
}
