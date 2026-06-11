import DateFieldBR from './DateFieldBR'

export default function TableFilters({
  title,
  nameValue = '',
  onNameChange = () => {},
  dateValue = '',
  onDateChange = () => {},
  showName = true,
  showDate = true,
  namePlaceholder = 'Buscar por nome',
}) {
  if (!showName && !showDate) return null

  return (
    <div className="table-filters">
      {title && <p className="filters-title">{title}</p>}
      {showName && (
        <label>
          Nome
          <input
            type="text"
            placeholder={namePlaceholder}
            value={nameValue}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
      )}
      {showDate && <DateFieldBR label="Data" value={dateValue} onChange={onDateChange} />}
      <button
        type="button"
        className="secondary"
        onClick={() => {
          onNameChange('')
          onDateChange('')
        }}
      >
        Limpar filtros
      </button>
    </div>
  )
}
