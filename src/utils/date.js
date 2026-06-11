export function getTodayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function getTomorrowInputValue() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function getCurrentMonthBounds() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const startLocal = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
  const endLocal = new Date(end.getTime() - end.getTimezoneOffset() * 60000)

  return {
    min: startLocal.toISOString().slice(0, 10),
    max: endLocal.toISOString().slice(0, 10),
  }
}

export function formatDateInputBR(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

export function parseDateInputBR(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null

  const sameDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)

  return sameDate ? isoDate : null
}

export function isDateWithinRange(value, min, max) {
  if (!value) return false
  if (min && value < min) return false
  if (max && value > max) return false
  return true
}

export function fmtDate(value) {
  if (!value) return '-'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day, 12, 0, 0))
}
