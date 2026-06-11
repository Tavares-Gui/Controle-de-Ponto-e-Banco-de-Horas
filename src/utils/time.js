export function minutesBetween(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export function calcWorked(entry, expectedDailyMinutes) {
  if (entry.is_absence) {
    return entry.is_partial_absence ? Math.round((expectedDailyMinutes || 480) / 2) : 0
  }

  return Math.max(
    0,
    minutesBetween(entry.entry_time, entry.break_start) + minutesBetween(entry.break_end, entry.exit_time),
  )
}

export function fmtMin(minutes) {
  const sign = minutes < 0 ? '-' : ''
  const abs = Math.abs(Math.round(minutes || 0))
  return `${sign}${Math.floor(abs / 60)}h ${abs % 60}min`
}

export function fmtTime(value) {
  if (!value) return '-'
  return String(value).slice(0, 5)
}
