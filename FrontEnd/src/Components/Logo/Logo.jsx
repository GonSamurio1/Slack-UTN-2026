import "./Logo.css"

/*
  Logo tipo Slack: trebol de 4 hojas con la paleta de la marca.
  Hecho con CSS puro (border-radius), sin SVG ni librerias.

  Props:
    - size: ancho/alto en px (opcional; por default usa clamp CSS fluido)
*/
export default function Logo({ size, className = "" }) {
  const style = size ? { width: size, height: size } : undefined

  return (
    <div
      className={`logo-clover ${className}`.trim()}
      style={style}
      role="img"
      aria-label="Logo"
    >
      <span className="logo-clover__leaf logo-clover__leaf--blue"></span>
      <span className="logo-clover__leaf logo-clover__leaf--green"></span>
      <span className="logo-clover__leaf logo-clover__leaf--yellow"></span>
      <span className="logo-clover__leaf logo-clover__leaf--red"></span>
    </div>
  )
}
