import { Link, useParams } from 'react-router-dom'
import { useChannelsList } from '../../Contexts/WorkspaceContext'
import "./ChannelList.css"

/*
Lista de canales del workspace (columna izquierda de la pantalla del workspace).
Cada canal es un link a /workspace/:workspace_id/channel/:channel_id,
donde vive la pantalla de mensajes del canal (paso 2.2).
*/
export default function ChannelList() {

  const { workspace_id } = useParams()

  const {
    channels_loading,
    channels_response,
    channels_error,
    reloadWorkspace
  } = useChannelsList()

  if (channels_loading) {
    return (
      <div className="channel-list channel-list--loading">
        <span className="channel-list__loader" />
        <p>Cargando canales...</p>
      </div>
    )
  }

  if (channels_error) {
    return (
      <div className="channel-list">
        <span className="channel-list__error">Error : {channels_error}</span>
        <button className="channel-list__retry" onClick={reloadWorkspace}>Recargar</button>
      </div>
    )
  }

  if (!channels_response) {
    return (
      <div className="channel-list">
        <span className="channel-list__error">Error : Ocurrio un problema al obtener la lista de canales</span>
        <button className="channel-list__retry" onClick={reloadWorkspace}>Recargar</button>
      </div>
    )
  }

  const channels = channels_response.data.channelsList

  return (
    <section className="channel-list">
      <h2 className="channel-list__title">Canales</h2>

      {channels.length > 0 ? (
        <ul className="channel-list__items">
          {channels.map((channel) => (
            <li key={channel._id} className="channel-list__item">
              <Link
                className="channel-list__link"
                to={`/workspace/${workspace_id}/channel/${channel._id}`}
              >
                <span className="channel-list__hash" aria-hidden="true">#</span>
                {channel.nombre}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="channel-list__empty">Aun no hay canales en este espacio</p>
      )}

      <Link className="channel-list__create" to={`/workspace/${workspace_id}/channel/new`}>
        <span className="channel-list__create-plus" aria-hidden="true">+</span>
        Crear canal
      </Link>
    </section>
  )
}
