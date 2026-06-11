import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import FeedbackMessage from '../components/common/FeedbackMessage'
import Table from '../components/common/Table'
import TableFilters from '../components/common/TableFilters'
import useFeedback from '../hooks/useFeedback'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../utils/date'
import { filterRows } from '../utils/filters'
import { fmtAbsenceDetail, fmtHoursRequested, fmtWorkModel, formatPhone } from '../utils/formatters'
import { fmtMin, fmtTime } from '../utils/time'

function badge(status) {
  return <span className={`badge ${status}`}>{status}</span>
}

export default function AdminPage({ currentUserId, currentRole }) {
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
    () => filterRows(employeeProfiles, summaryFilters, { getName: (row) => row.full_name }),
    [employeeProfiles, summaryFilters],
  )
  const filteredProfiles = useMemo(
    () => filterRows(profiles, profileFilters, { getName: (row) => row.full_name }),
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
