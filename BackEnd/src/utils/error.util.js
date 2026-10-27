/*
NO TODOS LO ERRORES SON IGUALES, EN BAKCEND VAMOS ATENER 2 GRANDES TIPOS DE ERROR :
  - Incontrolables => API RESPONDE 500 internal server error
  - Controlados => Son errores que si estan contemplados API lanzara el ServerError con mensaje y status
Un server error son errores contemplados del lado del servidor.
Los vamos a diferneciar de los errores comunes porque tienen status.
*/
class ServerError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export default ServerError

/*
throw sirve para lanzar errores en JS */