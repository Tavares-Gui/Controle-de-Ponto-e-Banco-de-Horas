import { absencePeriods } from '../constants/options'

export function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

export function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function fmtHoursRequested(value) {
  const numeric = Number(value || 0)
  return `${String(Number.isInteger(numeric) ? numeric : numeric.toFixed(2)).replace('.', ',')} h`
}

export function fmtWorkModel(value) {
  if (value === 'hibrido') return 'Hibrido'
  if (value === 'presencial') return 'Presencial'
  return value || '-'
}

export function fmtAbsenceDetail(entry) {
  if (!entry.is_absence) return '-'

  const reason =
    entry.absence_reason === 'Outro'
      ? entry.absence_other_reason || 'Outro'
      : entry.absence_reason || 'Sem motivo informado'

  if (entry.is_partial_absence) {
    const period = absencePeriods.find((item) => item.value === entry.absence_period)?.label || 'Periodo parcial'
    return `Parcial (${period}) - ${reason}`
  }

  return `Integral - ${reason}`
}
