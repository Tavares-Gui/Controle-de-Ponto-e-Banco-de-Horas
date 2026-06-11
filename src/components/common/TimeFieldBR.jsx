import { hourOptions, minuteOptions } from '../../constants/options'

export default function TimeFieldBR({ label, value, onChange, disabled = false }) {
  const [hour = '00', minute = '00'] = (value || '00:00').split(':')

  return (
    <label>
      {label}
      <div className="time-field">
        <select disabled={disabled} value={hour} onChange={(event) => onChange(`${event.target.value}:${minute}`)}>
          {hourOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>:</span>
        <select disabled={disabled} value={minute} onChange={(event) => onChange(`${hour}:${event.target.value}`)}>
          {minuteOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </label>
  )
}
