import React, { useEffect } from 'react'
import useRequest from '../../hooks/useRequest';
import { getAllWorkspaces } from '../../services/workspaceService';

function HomeScreen() {
  /*
  Llamar por HTTP (con fetch) a GET /api/workspace y renderizar la lista dewspacios de trbajo en este componente.

  Mostrar 'cargando...' mientras la reques aun se este haciendo, en caso de haber algun fallo mostrar 'Error : {error}'

  Si no hay ningun espacio de trabajo mostrar un mensaje de 'Aun no creaste ningun espacio de trabajo'

  PROTIP :
  - Usar el useRequest para manejar los estados de respuesta de la API
  - Cargar la funcion getAllWorkspaces oslo 1 vez para evitar re-rending infinito
  */
  const { response, error, loading, sendRequest } = useRequest();

  // Con este efecto me aseguro que sendRequest solo se ejcuta una vez
  useEffect(
    () => {
      sendRequest(
        getAllWorkspaces
      )
    },
    []
  )
  console.log(response, error, loading)

  return (
    <div>HomeScreen</div>
  )

}



export default HomeScreen