import React, { useEffect } from 'react'
import useForm from '../../hooks/useForm'
import { login } from '../../services/authService'
import useRequest from '../../hooks/useRequest'
import { useNavigate } from 'react-router-dom'

/*
Siguiendo las practicas implementadas al conecra el formlario del ogin con nuesa API REST. Desarrollar la implementacion del formulario de registro y la consultarla a la API REST
*/

function LoginScreen() {

  const initial_state = { email: '', password: '' }
  const { formState, handleChangeInput } = useForm(initial_state)
  const { loading, response, error, sendRequest } = useRequest()

  const navigate = useNavigate()


  async function handleSubmit(event) {
    event.preventDefault()
    sendRequest(
      () => login(formState.email, formState.password)
    )
    console.log('Usuario intenta iniciar sesion', formState)
  }

  /* Los efectos sirven para controlar la recarha/ejecucion de una funcion, cuando la response cambie/llegue:
    -voy a reidreccionar a /home
    -Guaradar en localstorage el auth_token (para poder seguir usandolo)

  */
  useEffect(
    () => {
      if (response && response.data) {
        //console.log('Respuesta del back:', response)
        localStorage.setItem('auth_token', response.data.authToken)
        navigate('/')
      }
    },
    [response]
  )

  return (
    <div>
      <h1>Inciar sesion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            name='email'
            id='email'
            type='email'
            value={formState.email}
            onChange={handleChangeInput}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            name='password'
            id='password'
            type='password'
            value={formState.password}
            onChange={handleChangeInput}
          />
        </div>
        {
          error
          &&
          !loading
          &&
          <span style={{ color: 'red' }}>{error}</span>
        }

        {
          loading
            ? <button type='submit' disabled={true} >Cargando...</button>
            : <button type='submit'>Iniciar sesion</button>
        }


        {
          response && !loading && <span style={{ color: 'greenyellow' }}>Inicio de sesion exitoso</span>
        }
      </form>
    </div>
  )
}

export default LoginScreen