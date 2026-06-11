import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import {
  CalendarDays,
  CheckCircle,
  Clock,
  LogOut,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'
import './style.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const absenceReasons = ['Atestado medico', 'Consulta medica', 'Problema familiar', 'Transporte', 'Outro']
const absencePeriods = [
  { value: 'manha', label: 'Manha' },
  { value: 'tarde', label: 'Tarde' },
]
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

function getTodayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function getTomorrowInputValue() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function getCurrentMonthBounds() {
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

function createInitialPointForm() {
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

function createInitialRequestForm() {
  return {
    request_date: getTomorrowInputValue(),
    hours_requested: '8',
    reason: '',
  }
}

function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatDateInputBR(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function parseDateInputBR(value) {
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

function isDateWithinRange(value, min, max) {
  if (!value) return false
  if (min && value < min) return false
  if (max && value > max) return false
  return true
}

function minutesBetween(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function calcWorked(entry, expectedDailyMinutes) {
  if (entry.is_absence) {
    return entry.is_partial_absence ? Math.round((expectedDailyMinutes || 480) / 2) : 0
  }

  return Math.max(
    0,
    minutesBetween(entry.entry_time, entry.break_start) + minutesBetween(entry.break_end, entry.exit_time),
  )
}

function fmtMin(minutes) {
  const sign = minutes < 0 ? '-' : ''
  const abs = Math.abs(Math.round(minutes || 0))
  return `${sign}${Math.floor(abs / 60)}h ${abs % 60}min`
}

function fmtDate(value) {
  if (!value) return '-'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day, 12, 0, 0))
}

function fmtTime(value) {
  if (!value) return '-'
  return String(value).slice(0, 5)
}

function fmtHoursRequested(value) {
  const numeric = Number(value || 0)
  return `${String(Number.isInteger(numeric) ? numeric : numeric.toFixed(2)).replace('.', ',')} h`
}

function fmtWorkModel(value) {
  if (value === 'hibrido') return 'Hibrido'
  if (value === 'presencial') return 'Presencial'
  return value || '-'
}

function fmtAbsenceDetail(entry) {
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

function filterRows(rows, { name = '', date = '' }, { getName, getDate }) {
  return rows.filter((row) => {
    const matchesName = !name || (getName?.(row) || '').toLowerCase().includes(name.toLowerCase())
    const matchesDate = !date || (getDate?.(row) || '') === date
    return matchesName && matchesDate
  })
}

function useFeedback() {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!feedback) return undefined
    const timeout = setTimeout(() => setFeedback(null), 4500)
    return () => clearTimeout(timeout)
  }, [feedback])

  function showSuccess(message) {
    setFeedback({ type: 'success', message })
  }

  function showError(message) {
    setFeedback({ type: 'error', message })
  }

  function clearFeedback() {
    setFeedback(null)
  }

  return { feedback, showSuccess, showError, clearFeedback }
}

function FeedbackMessage({ feedback }) {
  if (!feedback) return null
  return <p className={`msg ${feedback.type}`}>{feedback.message}</p>
}

function badge(status) {
  return <span className={`badge ${status}`}>{status}</span>
}

function DateFieldBR({ label, value, onChange, min, max }) {
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

function TableFilters({
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

function TimeFieldBR({ label, value, onChange, disabled = false }) {
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

function Table({ rows, cols, emptyMessage = 'Nenhum registro encontrado.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{cols.map((col) => <th key={col[0]}>{col[0]}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {cols.map((col) => (
                <td key={col[0]}>{typeof col[1] === 'function' ? col[1](row) : row[col[1]]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">{emptyMessage}</p>}
    </div>
  )
}

function Auth() {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const { feedback, showError, showSuccess, clearFeedback } = useFeedback()

  async function signUp() {
    if (!registerForm.full_name.trim()) {
      showError('Informe o nome completo.')
      return
    }

    if (onlyDigits(registerForm.phone).length < 10) {
      showError('Informe um telefone valido com DDD.')
      return
    }

    if (!registerForm.email.trim() || !registerForm.password.trim()) {
      showError('Preencha e-mail e senha para realizar o cadastro.')
      return
    }

    setLoading(true)
    clearFeedback()

    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          full_name: registerForm.full_name.trim(),
          phone: formatPhone(registerForm.phone),
        },
      },
    })

    if (error) {
      showError(error.message)
    } else {
      showSuccess('Cadastro realizado com sucesso. Agora voce ja pode entrar com seu e-mail e senha.')
      setMode('login')
      setLoginForm({ email: registerForm.email, password: '' })
      setRegisterForm({
        full_name: '',
        phone: '',
        email: '',
        password: '',
      })
    }

    setLoading(false)
  }

  async function login() {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      showError('Informe e-mail e senha para entrar.')
      return
    }

    setLoading(true)
    clearFeedback()

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    })

    if (error) {
      showError(error.message)
    } else {
      showSuccess('Login realizado com sucesso.')
    }

    setLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Controle de Ponto e Banco de Horas</h1>

        <div className="auth-switch">
          <button
            type="button"
            className={mode === 'login' ? 'active' : 'secondary'}
            onClick={() => {
              setMode('login')
              clearFeedback()
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : 'secondary'}
            onClick={() => {
              setMode('register')
              clearFeedback()
            }}
          >
            Cadastrar
          </button>
        </div>

        {mode === 'login' ? (
          <div className="auth-form">
            <input
              placeholder="E-mail"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            />
            <input
              placeholder="Senha"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
            />
            <button disabled={loading} onClick={login}>
              Entrar
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <input
              placeholder="Nome completo"
              value={registerForm.full_name}
              onChange={(event) => setRegisterForm({ ...registerForm, full_name: event.target.value })}
            />
            <input
              placeholder="Telefone"
              inputMode="tel"
              value={registerForm.phone}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, phone: formatPhone(event.target.value) })
              }
            />
            <input
              placeholder="E-mail"
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
            />
            <input
              placeholder="Senha"
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
            />
            <button disabled={loading} onClick={signUp}>
              Cadastrar
            </button>
          </div>
        )}

        <FeedbackMessage feedback={feedback} />
      </section>
    </main>
  )
}

function Employee({ session, profile }) {
  const [entries, setEntries] = useState([])
  const [requests, setRequests] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(createInitialPointForm)
  const [req, setReq] = useState(createInitialRequestForm)
  const [entryFilters, setEntryFilters] = useState({ date: '' })
  const [requestFilters, setRequestFilters] = useState({ date: '' })
  const { feedback, showError, showSuccess, clearFeedback } = useFeedback()
  const currentMonthBounds = useMemo(() => getCurrentMonthBounds(), [])
  const tomorrow = useMemo(() => getTomorrowInputValue(), [])

  async function load() {
    const [{ data: entryData, error: entryError }, { data: requestData, error: requestError }] = await Promise.all([
      supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('work_date', { ascending: false }),
      supabase
        .from('day_off_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),
    ])

    if (entryError) {
      showError(`Nao foi possivel carregar o historico de jornada: ${entryError.message}`)
    }

    if (requestError) {
      showError(`Nao foi possivel carregar as solicitacoes de folga: ${requestError.message}`)
    }

    setEntries(entryData || [])
    setRequests(requestData || [])
  }

  useEffect(() => {
    load()
  }, [session.user.id])

  const summary = useMemo(() => {
    const saldo = (entries || []).reduce((acc, entry) => acc + (entry.balance_minutes || 0), 0)
    return {
      saldo,
      pos: entries.filter((entry) => (entry.balance_minutes || 0) > 0).length,
      neg: entries.filter((entry) => (entry.balance_minutes || 0) < 0).length,
      sol: requests.length,
    }
  }, [entries, requests])

  const filteredEntries = useMemo(
    () => filterRows(entries, entryFilters, { getDate: (row) => row.work_date }),
    [entries, entryFilters],
  )
  const filteredRequests = useMemo(
    () => filterRows(requests, requestFilters, { getDate: (row) => row.request_date }),
    [requests, requestFilters],
  )

  async function savePoint() {
    clearFeedback()

    if (!parseDateInputBR(formatDateInputBR(form.work_date))) {
      showError('Informe uma data valida para o registro de ponto.')
      return
    }

    if (!isDateWithinRange(form.work_date, currentMonthBounds.min, currentMonthBounds.max)) {
      showError('O ponto so pode ser registrado dentro do mes atual.')
      return
    }

    if (form.is_absence && form.absence_reason === 'Outro' && !form.absence_other_reason.trim()) {
      showError('Descreva o motivo da falta.')
      return
    }

    setSaving(true)
    const expectedDailyMinutes = Number(profile.expected_daily_minutes || 480)
    const workedMinutes = calcWorked(form, expectedDailyMinutes)
    const payload = {
      user_id: session.user.id,
      work_date: form.work_date,
      entry_time: form.is_absence ? null : form.entry_time,
      break_start: form.is_absence ? null : form.break_start,
      break_end: form.is_absence ? null : form.break_end,
      exit_time: form.is_absence ? null : form.exit_time,
      work_model: form.work_model,
      observation: form.observation.trim(),
      is_absence: form.is_absence,
      is_partial_absence: form.is_absence ? form.is_partial_absence : false,
      absence_period: form.is_absence ? (form.is_partial_absence ? form.absence_period : 'dia_todo') : null,
      absence_reason: form.is_absence ? form.absence_reason : null,
      absence_other_reason:
        form.is_absence && form.absence_reason === 'Outro' ? form.absence_other_reason.trim() : null,
      worked_minutes: workedMinutes,
      balance_minutes: workedMinutes - expectedDailyMinutes,
    }

    const { error } = await supabase.from('time_entries').insert(payload)
    if (error) {
      showError(`Nao foi possivel salvar o ponto: ${error.message}`)
    } else {
      setForm((current) => ({
        ...createInitialPointForm(),
        work_date: current.work_date,
      }))
      await load()
      showSuccess('Ponto registrado com sucesso.')
    }
    setSaving(false)
  }

  async function saveRequest() {
    clearFeedback()

    if (!parseDateInputBR(formatDateInputBR(req.request_date))) {
      showError('Informe uma data valida para a solicitacao de folga.')
      return
    }

    if (!isDateWithinRange(req.request_date, tomorrow)) {
      showError('A folga so pode ser solicitada para datas posteriores ao dia atual.')
      return
    }

    if (!req.reason.trim()) {
      showError('Informe o motivo da solicitacao de folga.')
      return
    }

    const hoursRequested = Number(req.hours_requested)
    if (!hoursRequested || hoursRequested <= 0) {
      showError('Informe uma quantidade de horas valida.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('day_off_requests').insert({
      user_id: session.user.id,
      request_date: req.request_date,
      hours_requested: hoursRequested,
      reason: req.reason.trim(),
    })

    if (error) {
      showError(`Nao foi possivel enviar a solicitacao: ${error.message}`)
    } else {
      setReq(createInitialRequestForm())
      await load()
      showSuccess('Solicitacao de folga enviada com sucesso.')
    }
    setSaving(false)
  }

  return (
    <div className="grid">
      <section className="stats wide">
        <div>
          <b>Saldo</b>
          <strong>{fmtMin(summary.saldo)}</strong>
        </div>
        <div>
          <b>Dias positivos</b>
          <strong>{summary.pos}</strong>
        </div>
        <div>
          <b>Dias negativos</b>
          <strong>{summary.neg}</strong>
        </div>
        <div>
          <b>Solicitacoes</b>
          <strong>{summary.sol}</strong>
        </div>
      </section>

      <section className="wide">
        <FeedbackMessage feedback={feedback} />
      </section>

      <section className="card wide">
        <h2>
          <Clock /> Registrar jornada
        </h2>
        <p className="section-note">
          Datas no formato dd/mm/aaaa e horarios no formato brasileiro de 24 horas.
        </p>
        <div className="form-grid">
          <DateFieldBR
            label="Data"
            value={form.work_date}
            min={currentMonthBounds.min}
            max={currentMonthBounds.max}
            onChange={(value) => setForm({ ...form, work_date: value })}
          />
          <TimeFieldBR
            label="Entrada"
            disabled={form.is_absence}
            value={form.entry_time}
            onChange={(value) => setForm({ ...form, entry_time: value })}
          />
          <TimeFieldBR
            label="Saida para intervalo"
            disabled={form.is_absence}
            value={form.break_start}
            onChange={(value) => setForm({ ...form, break_start: value })}
          />
          <TimeFieldBR
            label="Volta do intervalo"
            disabled={form.is_absence}
            value={form.break_end}
            onChange={(value) => setForm({ ...form, break_end: value })}
          />
          <TimeFieldBR
            label="Saida"
            disabled={form.is_absence}
            value={form.exit_time}
            onChange={(value) => setForm({ ...form, exit_time: value })}
          />
          <label>
            Modelo
            <select value={form.work_model} onChange={(event) => setForm({ ...form, work_model: event.target.value })}>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Hibrido</option>
            </select>
          </label>
        </div>

        <div className="checks">
          <label className="check">
            <input
              type="checkbox"
              checked={form.is_absence}
              onChange={(event) =>
                setForm({
                  ...form,
                  is_absence: event.target.checked,
                  is_partial_absence: event.target.checked ? form.is_partial_absence : false,
                })
              }
            />
            Registrar falta
          </label>

          {form.is_absence && (
            <label className="check">
              <input
                type="checkbox"
                checked={form.is_partial_absence}
                onChange={(event) => setForm({ ...form, is_partial_absence: event.target.checked })}
              />
              Falta parcial
            </label>
          )}
        </div>

        {form.is_absence && (
          <div className="form-grid">
            {form.is_partial_absence && (
              <label>
                Periodo da jornada afetado
                <select
                  value={form.absence_period}
                  onChange={(event) => setForm({ ...form, absence_period: event.target.value })}
                >
                  {absencePeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Motivo da falta
              <select
                value={form.absence_reason}
                onChange={(event) => setForm({ ...form, absence_reason: event.target.value })}
              >
                {absenceReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>

            {form.absence_reason === 'Outro' && (
              <label>
                Descreva o motivo
                <input
                  value={form.absence_other_reason}
                  onChange={(event) => setForm({ ...form, absence_other_reason: event.target.value })}
                />
              </label>
            )}
          </div>
        )}

        <textarea
          placeholder="Observacao do ponto"
          value={form.observation}
          onChange={(event) => setForm({ ...form, observation: event.target.value })}
        />
        <button disabled={saving} onClick={savePoint}>
          Salvar ponto
        </button>
      </section>

      <section className="card wide">
        <h2>
          <CalendarDays /> Solicitar folga
        </h2>
        <DateFieldBR
          label="Data"
          value={req.request_date}
          min={tomorrow}
          onChange={(value) => setReq({ ...req, request_date: value })}
        />
        <label>
          Horas utilizadas
          <input
            type="number"
            min="1"
            step="0.5"
            value={req.hours_requested}
            onChange={(event) => setReq({ ...req, hours_requested: event.target.value })}
          />
        </label>
        <textarea
          placeholder="Motivo"
          value={req.reason}
          onChange={(event) => setReq({ ...req, reason: event.target.value })}
        />
        <button disabled={saving} onClick={saveRequest}>
          Enviar solicitacao
        </button>
      </section>

      <section className="card wide">
        <h2>Historico de jornada</h2>
        <TableFilters
          title="Filtre o historico por data"
          showName={false}
          dateValue={entryFilters.date}
          onDateChange={(value) => setEntryFilters({ date: value })}
        />
        <Table
          rows={filteredEntries}
          cols={[
            ['Data', (row) => fmtDate(row.work_date)],
            ['Entrada', (row) => fmtTime(row.entry_time)],
            ['Saida intervalo', (row) => fmtTime(row.break_start)],
            ['Volta intervalo', (row) => fmtTime(row.break_end)],
            ['Saida', (row) => fmtTime(row.exit_time)],
            ['Modelo', (row) => fmtWorkModel(row.work_model)],
            ['Falta', (row) => (row.is_absence ? 'Sim' : 'Nao')],
            ['Detalhe da falta', (row) => fmtAbsenceDetail(row)],
            ['Trabalhado', (row) => fmtMin(row.worked_minutes)],
            ['Saldo', (row) => fmtMin(row.balance_minutes)],
            ['Observacao', 'observation'],
          ]}
        />
      </section>

      <section className="card wide">
        <h2>Solicitacoes de folga</h2>
        <TableFilters
          title="Filtre as solicitacoes por data"
          showName={false}
          dateValue={requestFilters.date}
          onDateChange={(value) => setRequestFilters({ date: value })}
        />
        <Table
          rows={filteredRequests}
          cols={[
            ['Data', (row) => fmtDate(row.request_date)],
            ['Horas', (row) => fmtHoursRequested(row.hours_requested)],
            ['Motivo', 'reason'],
            ['Status', (row) => badge(row.status)],
          ]}
        />
      </section>
    </div>
  )
}

function Admin({ currentUserId, currentRole }) {
  const [profiles, setProfiles] = useState([])
  const [entries, setEntries] = useState([])
  const [requests, setRequests] = useState([])
  const [pendingFilters, setPendingFilters] = useState({ name: '', date: '' })
  const [summaryFilters, setSummaryFilters] = useState({ name: '' })
  const [profileFilters, setProfileFilters] = useState({ name: '' })
  const [entryFilters, setEntryFilters] = useState({ name: '', date: '' })
  const [requestFilters, setRequestFilters] = useState({ name: '', date: '' })
  const { feedback, showError, showSuccess } = useFeedback()

  async function load() {
    const [profileResponse, entryResponse, requestResponse] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('time_entries').select('*, profile:profiles(full_name, role)').order('work_date', { ascending: false }),
      supabase
        .from('day_off_requests')
        .select(
          '*, requester:profiles!day_off_requests_user_id_fkey(full_name, role), reviewer:profiles!day_off_requests_reviewed_by_fkey(full_name)',
        )
        .order('created_at', { ascending: false }),
    ])

    if (profileResponse.error) {
      showError(`Nao foi possivel carregar os perfis: ${profileResponse.error.message}`)
    }

    if (entryResponse.error) {
      showError(`Nao foi possivel carregar as jornadas: ${entryResponse.error.message}`)
    }

    if (requestResponse.error) {
      showError(`Nao foi possivel carregar as solicitacoes: ${requestResponse.error.message}`)
    }

    setProfiles(profileResponse.data || [])
    setEntries(entryResponse.data || [])
    setRequests(requestResponse.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const employeeProfiles = useMemo(() => profiles.filter((profile) => profile.role === 'employee'), [profiles])
  const employeeIds = useMemo(() => new Set(employeeProfiles.map((profile) => profile.id)), [employeeProfiles])
  const employeeEntries = useMemo(() => entries.filter((entry) => employeeIds.has(entry.user_id)), [entries, employeeIds])
  const employeeRequests = useMemo(() => requests.filter((request) => employeeIds.has(request.user_id)), [requests, employeeIds])
  const pendingRequests = useMemo(
    () => employeeRequests.filter((request) => request.status === 'pendente'),
    [employeeRequests],
  )
  const generalBalance = useMemo(
    () => employeeEntries.reduce((acc, entry) => acc + (entry.balance_minutes || 0), 0),
    [employeeEntries],
  )
  const canManageProfiles = currentRole === 'gestor'
  const filteredPendingRequests = useMemo(
    () =>
      filterRows(pendingRequests, pendingFilters, {
        getName: (row) => row.requester?.full_name,
        getDate: (row) => row.request_date,
      }),
    [pendingRequests, pendingFilters],
  )
  const filteredEmployeeProfiles = useMemo(
    () =>
      filterRows(employeeProfiles, summaryFilters, {
        getName: (row) => row.full_name,
      }),
    [employeeProfiles, summaryFilters],
  )
  const filteredProfiles = useMemo(
    () =>
      filterRows(profiles, profileFilters, {
        getName: (row) => row.full_name,
      }),
    [profiles, profileFilters],
  )
  const filteredEmployeeEntries = useMemo(
    () =>
      filterRows(employeeEntries, entryFilters, {
        getName: (row) => row.profile?.full_name,
        getDate: (row) => row.work_date,
      }),
    [employeeEntries, entryFilters],
  )
  const filteredEmployeeRequests = useMemo(
    () =>
      filterRows(employeeRequests, requestFilters, {
        getName: (row) => row.requester?.full_name,
        getDate: (row) => row.request_date,
      }),
    [employeeRequests, requestFilters],
  )

  async function decide(requestId, status) {
    const { error } = await supabase
      .from('day_off_requests')
      .update({
        status,
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) {
      showError(`Nao foi possivel atualizar a solicitacao: ${error.message}`)
      return
    }

    await load()
    showSuccess(`Solicitacao ${status === 'aprovada' ? 'aprovada' : 'negada'} com sucesso.`)
  }

  async function updateProfile(profileId, field, value) {
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', profileId)

    if (error) {
      showError(`Nao foi possivel atualizar o perfil: ${error.message}`)
      return
    }

    await load()
    showSuccess('Perfil atualizado com sucesso.')
  }

  return (
    <div className="grid">
      <section className="stats wide">
        <div>
          <b>Colaboradores</b>
          <strong>{employeeProfiles.length}</strong>
        </div>
        <div>
          <b>Pendentes</b>
          <strong>{pendingRequests.length}</strong>
        </div>
        <div>
          <b>Aprovadas</b>
          <strong>{employeeRequests.filter((request) => request.status === 'aprovada').length}</strong>
        </div>
        <div>
          <b>Negadas</b>
          <strong>{employeeRequests.filter((request) => request.status === 'negada').length}</strong>
        </div>
        <div>
          <b>Saldo geral</b>
          <strong>{fmtMin(generalBalance)}</strong>
        </div>
      </section>

      <section className="wide">
        <FeedbackMessage feedback={feedback} />
      </section>

      <section className="card wide">
        <h2>Solicitacoes pendentes</h2>
        <TableFilters
          title="Busque solicitacoes por nome e data"
          nameValue={pendingFilters.name}
          onNameChange={(value) => setPendingFilters((current) => ({ ...current, name: value }))}
          dateValue={pendingFilters.date}
          onDateChange={(value) => setPendingFilters((current) => ({ ...current, date: value }))}
        />
        <Table
          rows={filteredPendingRequests}
          emptyMessage="Nenhuma solicitacao pendente."
          cols={[
            ['Colaborador', (row) => row.requester?.full_name || '-'],
            ['Data', (row) => fmtDate(row.request_date)],
            ['Horas', (row) => fmtHoursRequested(row.hours_requested)],
            ['Motivo', 'reason'],
            [
              'Acoes',
              (row) => (
                <div className="actions">
                  <button className="small" onClick={() => decide(row.id, 'aprovada')}>
                    <CheckCircle size={14} />
                    Aprovar
                  </button>
                  <button className="small danger" onClick={() => decide(row.id, 'negada')}>
                    <XCircle size={14} />
                    Negar
                  </button>
                </div>
              ),
            ],
          ]}
        />
      </section>

      <section className="card wide">
        <h2>Resumo dos colaboradores</h2>
        <TableFilters
          title="Busque colaboradores por nome"
          nameValue={summaryFilters.name}
          onNameChange={(value) => setSummaryFilters({ name: value })}
          showDate={false}
        />
        <Table
          rows={filteredEmployeeProfiles}
          cols={[
            ['Nome', 'full_name'],
            ['Telefone', (row) => row.phone || '-'],
            ['Perfil', () => 'Colaborador'],
            ['Jornada', (row) => fmtMin(row.expected_daily_minutes)],
            [
              'Saldo',
              (row) =>
                fmtMin(
                  employeeEntries
                    .filter((entry) => entry.user_id === row.id)
                    .reduce((acc, entry) => acc + (entry.balance_minutes || 0), 0),
                ),
            ],
            [
              'Pendencias',
              (row) =>
                employeeRequests.filter((request) => request.user_id === row.id && request.status === 'pendente').length,
            ],
          ]}
        />
      </section>

      {canManageProfiles && (
        <section className="card wide">
          <h2>Gerenciar perfis</h2>
          <TableFilters
            title="Busque perfis por nome"
            nameValue={profileFilters.name}
            onNameChange={(value) => setProfileFilters({ name: value })}
            showDate={false}
          />
          <Table
            rows={filteredProfiles}
            cols={[
              [
                'Nome',
                (row) => (
                  <input
                    value={row.full_name}
                    onChange={(event) =>
                      setProfiles(
                        profiles.map((profile) =>
                          profile.id === row.id ? { ...profile, full_name: event.target.value } : profile,
                        ),
                      )
                    }
                    onBlur={(event) => updateProfile(row.id, 'full_name', event.target.value)}
                  />
                ),
              ],
              [
                'Telefone',
                (row) => (
                  <input
                    value={row.phone || ''}
                    onChange={(event) =>
                      setProfiles(
                        profiles.map((profile) =>
                          profile.id === row.id ? { ...profile, phone: formatPhone(event.target.value) } : profile,
                        ),
                      )
                    }
                    onBlur={(event) => updateProfile(row.id, 'phone', formatPhone(event.target.value))}
                  />
                ),
              ],
              [
                'Perfil',
                (row) => (
                  <select value={row.role} onChange={(event) => updateProfile(row.id, 'role', event.target.value)}>
                    <option value="employee">colaborador</option>
                    <option value="admin">administrador</option>
                    <option value="gestor">gestor</option>
                  </select>
                ),
              ],
              [
                'Jornada diaria',
                (row) => (
                  <input
                    type="number"
                    min="1"
                    value={row.expected_daily_minutes}
                    onChange={(event) => updateProfile(row.id, 'expected_daily_minutes', Number(event.target.value))}
                  />
                ),
              ],
            ]}
          />
        </section>
      )}

      <section className="card wide">
        <h2>Todas as jornadas registradas</h2>
        <TableFilters
          title="Busque jornadas por nome e data"
          nameValue={entryFilters.name}
          onNameChange={(value) => setEntryFilters((current) => ({ ...current, name: value }))}
          dateValue={entryFilters.date}
          onDateChange={(value) => setEntryFilters((current) => ({ ...current, date: value }))}
        />
        <Table
          rows={filteredEmployeeEntries}
          cols={[
            ['Colaborador', (row) => row.profile?.full_name || '-'],
            ['Data', (row) => fmtDate(row.work_date)],
            ['Entrada', (row) => fmtTime(row.entry_time)],
            ['Saida intervalo', (row) => fmtTime(row.break_start)],
            ['Volta intervalo', (row) => fmtTime(row.break_end)],
            ['Saida', (row) => fmtTime(row.exit_time)],
            ['Modelo', (row) => fmtWorkModel(row.work_model)],
            ['Falta', (row) => (row.is_absence ? 'Sim' : 'Nao')],
            ['Detalhe da falta', (row) => fmtAbsenceDetail(row)],
            ['Trabalhado', (row) => fmtMin(row.worked_minutes)],
            ['Saldo', (row) => fmtMin(row.balance_minutes)],
            ['Observacao', 'observation'],
          ]}
        />
      </section>

      <section className="card wide">
        <h2>Todas as solicitacoes de folga</h2>
        <TableFilters
          title="Busque solicitacoes por nome e data"
          nameValue={requestFilters.name}
          onNameChange={(value) => setRequestFilters((current) => ({ ...current, name: value }))}
          dateValue={requestFilters.date}
          onDateChange={(value) => setRequestFilters((current) => ({ ...current, date: value }))}
        />
        <Table
          rows={filteredEmployeeRequests}
          cols={[
            ['Colaborador', (row) => row.requester?.full_name || '-'],
            ['Data', (row) => fmtDate(row.request_date)],
            ['Horas', (row) => fmtHoursRequested(row.hours_requested)],
            ['Motivo', 'reason'],
            ['Status', (row) => badge(row.status)],
            ['Analisado por', (row) => row.reviewer?.full_name || '-'],
          ]}
        />
      </section>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [session])

  if (!session) return <Auth />
  if (!profile) return <div className="loading">Carregando...</div>

  const hasAdminAccess = profile.role === 'admin' || profile.role === 'gestor'
  const roleLabel = profile.role === 'gestor' ? 'Gestor' : profile.role === 'admin' ? 'Administrador' : 'Colaborador'

  return (
    <>
      <header>
        <div>
          <h1>
            <Clock /> Controle de Ponto
          </h1>
          <p className="header-subtitle">
            {hasAdminAccess ? 'Painel administrativo' : 'Painel do colaborador'} | {profile.full_name}
          </p>
        </div>
        <nav>
          {hasAdminAccess ? (
            <button className="active" type="button">
              <ShieldCheck size={16} />
              {roleLabel}
            </button>
          ) : (
            <button className="active" type="button">
              <User size={16} />
              Colaborador
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} />
            Sair
          </button>
        </nav>
      </header>

      <main>
        {hasAdminAccess ? (
          <Admin currentUserId={session.user.id} currentRole={profile.role} />
        ) : (
          <Employee session={session} profile={profile} />
        )}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
