export const absenceReasons = ['Atestado medico', 'Consulta medica', 'Problema familiar', 'Transporte', 'Outro']

export const absencePeriods = [
  { value: 'manha', label: 'Manha' },
  { value: 'tarde', label: 'Tarde' },
]

export const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
export const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
