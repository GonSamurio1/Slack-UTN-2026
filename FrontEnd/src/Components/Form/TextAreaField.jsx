import "./TextField.css"

/*
  Campo de formulario reutilizable: label + textarea multilínea.
  Comparte los estilos de TextField (clases .text-field). Si recibe
  maxLength, muestra el contador de caracteres debajo del campo.

  Props:
    - label, name, id, value, onChange
    - maxLength: limite de caracteres opcional (muestra el contador)
    - rows: alto visible del textarea (default 4)
*/
export default function TextAreaField({
  label,
  name,
  id,
  value,
  onChange,
  maxLength,
  rows = 4
}) {
  return (
    <div className="text-field">
      <label className="text-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="text-field__textarea"
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
      />
      {maxLength && (
        <span className="text-field__char-counter">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  )
}
