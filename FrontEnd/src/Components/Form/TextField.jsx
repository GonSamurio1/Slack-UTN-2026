import "./TextField.css"

/*
  Campo de formulario reutilizable: label + input.
  Estilo Slack con foco en el color principal.

  Props:
    - label, name, id, type, value, onChange
*/
export default function TextField({
  label,
  name,
  id,
  type = "text",
  value,
  onChange
}) {
  return (
    <div className="text-field">
      <label className="text-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        className="text-field__input"
        name={name}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
