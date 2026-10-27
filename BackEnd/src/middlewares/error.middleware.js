//Middleware de errores (Oficina de errores)
//Si bien llamamos a next en este caso NO nos interesa usarlo PORQUE no hay oficina sig a la de errores

//Conclusion simple: Con este middleware de errores centralizas cualquier error de tu API, todos los errores terminaran aqui y se manejaran desde aqui
function errorHandlerMiddleware(error, req, res, next) {

  //Error esperable del sistema
  if (error.status) {
    return res.status(error.status).json(
      {
        ok: false,
        status: error.status,
        message: error.message
      }
    )
  }
  //Es un error inesperado
  else {
    console.log('[Middleware de Error]:', error)
    //Error generico
    return res.status(500).json(
      {
        ok: false,
        status: 500,
        message: 'Internal server error'
      }
    )
  }
}

export default errorHandlerMiddleware