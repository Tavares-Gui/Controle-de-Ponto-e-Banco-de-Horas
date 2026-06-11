import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { absencePeriods, absenceReasons } from '../constants/options'
import DateFieldBR from '../components/common/DateFieldBR'
import FeedbackMessage from '../components/common/FeedbackMessage'
import Table from '../components/common/Table'
import TableFilters from '../components/common/TableFilters'
import TimeFieldBR from '../components/common/TimeFieldBR'
import useFeedback from '../hooks/useFeedback'
import { supabase } from '../lib/supabase'
import { getCurrentMonthBounds, getTomorrowInputValue, isDateWithinRange, parseDateInputBR, formatDateInputBR, fmtDate } from '../utils/date'
import { filterRows } from '../utils/filters'
import { fmtAbsenceDetail, fmtHoursRequested, fmtWorkModel } from '../utils/formatters'
import { createInitialPointForm, createInitialRequestForm } from '../utils/forms'
import { calcWorked, fmtMin, fmtTime } from '../utils/time'

export default function EmployeePage({ session, profile }) {
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
