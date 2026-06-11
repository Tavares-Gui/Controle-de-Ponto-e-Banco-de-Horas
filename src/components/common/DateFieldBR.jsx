export default function DateFieldBR({ label, value, onChange, min, max }) {
  return (
    <label>
      {label}
      <input
        type="date"
        lang="pt-BR"
        value={value || ''}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
