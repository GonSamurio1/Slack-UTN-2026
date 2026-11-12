import "./Button.css"

/*
  Boton principal reutilizable con estado de carga.
  Cuando loading=true queda deshabilitado y muestra un spinner.

  Props:
    - children: texto del boton
    - type: "submit" | "button"
    - loading: muestra spinner y "Cargando..."
    - disabled: deshabilita el boton
*/
export default function Button({
  children,
  type = "button",
  loading = false,
  disabled = false
}) {
  const isDisabled = disabled || loading

  return (
    <button
      className="button button--primary"
      type={type}
      disabled={isDisabled}
    >
      {loading && <span className="button__spinner" aria-hidden="true"></span>}
      {loading ? "Cargando..." : children}
    </button>
  )
}
