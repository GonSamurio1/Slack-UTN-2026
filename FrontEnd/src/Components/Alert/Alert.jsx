import "./Alert.css"

/*
  Banner inline para mensajes del servidor (errores, exito, info).
  Se muestra en el flujo del formulario, sin modal ni overlay.

  Props:
    - type: "error" | "success" | "info"
    - message: texto a mostrar (si es null/undefined no renderiza nada)
*/
export default function Alert({ type = "info", message }) {
  if (!message) return null

  return (
    <div className={`alert alert--${type}`} role="alert">
      {message}
    </div>
  )
}
