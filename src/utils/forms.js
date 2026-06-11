import { getCurrentMonthBounds, getTodayInputValue, getTomorrowInputValue } from './date'

export function createInitialPointForm() {
  const { min, max } = getCurrentMonthBounds()
  const today = getTodayInputValue()

  return {
    work_date: today >= min && today <= max ? today : max,
    entry_time: '08:00',
    break_start: '12:00',
    break_end: '13:00',
    exit_time: '17:00',
    work_model: 'presencial',
    observation: '',
    is_absence: false,
    is_partial_absence: false,
    absence_period: 'manha',
    absence_reason: 'Atestado medico',
    absence_other_reason: '',
  }
}

export function createInitialRequestForm() {
  return {
    request_date: getTomorrowInputValue(),
    hours_requested: '8',
    reason: '',
  }
}
