import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  School,
  Send,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'

type StudentDisplayMode = 'real' | 'obfuscated'
type SchoolOption = { id: string; name: string }
type WorkspaceContext = {
  role: string
  schools: SchoolOption[]
  defaultSchoolId: string | null
  schoolSelectionEnabled: boolean
  teacherLockedToSignedInUser: boolean
}
type FilterOption = { value: string; label: string }
type MissingStudent = {
  id: string
  name: string
  obfuscatedName?: string
  asn?: string
  obfuscatedAsn?: string
  grade?: string
}
type PeriodSummary = {
  period: number
  label: string
  expected: number
  completed: number
  missing: MissingStudent[]
}
type Accountability = {
  id: string
  label: string
  expected: number
  completed: number
  missing: number
  completionRate: number
}
type RecommendedAction = { kind: string; title: string; detail: string; priority: string }
type Dashboard = {
  assessmentType: string
  schoolYear: string
  role: string
  scopeLabel: string
  refreshedAt: string
  selectedPeriod: number
  schools: SchoolOption[]
  sectionGroups: FilterOption[]
  courses: FilterOption[]
  teachers: FilterOption[]
  periods: PeriodSummary[]
  accountability: Accountability[]
  recommendedActions: RecommendedAction[]
  rosterCount: number
}
type CopilotHandoff = {
  id?: string | null
  status: string
  title?: string | null
  message?: string | null
  expiresAtUtc?: string | null
}
type CopilotChatReply = {
  message: string
  conversationId: string
  responseId?: string | null
  handoffId?: string | null
  handoffStatus?: string | null
  handoffTitle?: string | null
  handoffMessage?: string | null
  handoffExpiresAtUtc?: string | null
}
type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
  handoff?: CopilotHandoff
}

type Props = {
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  effectiveRole: string
  studentDisplayMode: StudentDisplayMode
  onContextChange: (context: { breadcrumb: string[]; filterCount: number }) => void
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store', signal })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; error?: string } | null
    throw new Error(problem?.title ?? problem?.error ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; error?: string; detail?: string } | null
    throw new Error(problem?.error ?? problem?.title ?? problem?.detail ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

function completionRate(completed: number, expected: number) {
  return expected === 0 ? 0 : Math.round(completed * 100 / expected)
}

function audienceLabel(role: string) {
  if (role === 'Executive' || role === 'Data Administrator') return 'Executive / Data Administrator'
  if (role === 'School Administrator') return 'School Administrator'
  if (role === 'Student Support') return 'Student Support'
  if (role === 'Specialist Support') return 'Specialist Support'
  return 'Teacher'
}

function dashboardHeading(role: string, schoolSelected: boolean) {
  if (role === 'Executive' || role === 'Data Administrator') {
    if (!schoolSelected) {
      return ['Select a school to review completion', 'Choose a permitted school before Nexus loads student rosters, completion records, and recommended actions.']
    }
    return ['School completion and teacher follow-up', 'Review current-period completion for the selected school and identify the teachers and students who need follow-up.']
  }
  if (role === 'School Administrator') {
    return ['School completion and teacher follow-up', 'Identify the teachers and students who need a prompt before the current assessment window closes.']
  }
  return ['My students and next actions', 'Complete outstanding screeners for assigned students and prepare for the next assessment window.']
}

function ScreenersCopilotRail({
  scope,
  role,
  period,
  school,
  assessmentType,
  eligible,
  completed,
  missing,
  completion,
  schoolId,
  sectionGroup,
  courseNumber,
  teacherId,
  assessmentPeriod,
  obfuscateStudentData,
  onClose,
}: {
  scope: string
  role: string
  period: string
  school: string
  assessmentType: string
  eligible: number
  completed: number
  missing: number
  completion: number
  schoolId: string
  sectionGroup: string
  courseNumber: string
  teacherId: string
  assessmentPeriod: number
  obfuscateStudentData: boolean
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [handoffBusyId, setHandoffBusyId] = useState('')
  const [messages, setMessages] = useState<CopilotMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    text: `I can help interpret the governed completion data in the current view. This scope is at ${completion}% completion with ${missing} result${missing === 1 ? '' : 's'} requiring follow-up.`,
  }])
  const suggestions = school
    ? ['Summarize outstanding results', 'Which teachers need follow-up?', 'Prepare a completion reminder']
    : ['Which schools need attention?', 'Summarize division completion', 'Compare completion against target']

  const sendPrompt = async (prompt: string) => {
    const question = prompt.trim()
    if (!question || sending) return
    const userMessage: CopilotMessage = { id: `user-${Date.now()}`, role: 'user', text: question }
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setError('')
    setSending(true)
    try {
      const reply = await postJson<CopilotChatReply>('/api/copilot/chat', {
        prompt: question,
        conversationId,
        scope,
        school: school || null,
        assessmentType,
        period,
        eligible,
        completed,
        missing,
        completionRate: completion,
        schoolId: schoolId || null,
        sectionGroup: sectionGroup || null,
        courseNumber: courseNumber || null,
        teacherId: teacherId || null,
        assessmentPeriod,
        obfuscateStudentData,
      })
      setConversationId(reply.conversationId)
      setMessages((current) => [...current, {
        id: reply.responseId ?? `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply.message,
        handoff: reply.handoffStatus ? {
          id: reply.handoffId,
          status: reply.handoffStatus,
          title: reply.handoffTitle,
          message: reply.handoffMessage,
          expiresAtUtc: reply.handoffExpiresAtUtc,
        } : undefined,
      }])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The Nexus assistant could not complete the request.')
    } finally {
      setSending(false)
    }
  }

  const resolveHandoff = async (messageId: string, handoff: CopilotHandoff, action: 'confirm' | 'cancel') => {
    if (!handoff.id || handoffBusyId) return
    setHandoffBusyId(handoff.id)
    setError('')
    try {
      if (action === 'confirm') {
        const reply = await postJson<CopilotChatReply>(`/api/copilot/handoff/${handoff.id}/confirm`, {})
        setConversationId(reply.conversationId)
        setMessages((current) => current.map((message) => message.id === messageId ? {
          ...message,
          text: reply.message,
          handoff: {
            id: reply.handoffId ?? handoff.id,
            status: reply.handoffStatus ?? 'Completed',
            title: reply.handoffTitle ?? handoff.title,
            message: reply.handoffMessage,
            expiresAtUtc: reply.handoffExpiresAtUtc,
          },
        } : message))
      } else {
        const reply = await postJson<{ message: string; handoffStatus: string; handoffTitle?: string | null }>(
          `/api/copilot/handoff/${handoff.id}/cancel`,
          {},
        )
        setMessages((current) => current.map((message) => message.id === messageId ? {
          ...message,
          text: reply.message,
          handoff: {
            ...handoff,
            status: reply.handoffStatus ?? 'Cancelled',
            title: reply.handoffTitle ?? handoff.title,
          },
        } : message))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The Work IQ handoff could not be updated.')
    } finally {
      setHandoffBusyId('')
    }
  }

  return (
    <aside className="hd-screeners-copilot" id="student-screeners-copilot" aria-label="Nexus Copilot chat">
      <header>
        <div className="hd-screeners-copilot__brand"><span><Sparkles aria-hidden="true" /></span><div><small>Microsoft Copilot</small><h2>Nexus assistant</h2></div></div>
        <button type="button" aria-label="Close Copilot" title="Close Copilot" onClick={onClose}><X aria-hidden="true" /></button>
      </header>
      <div className="hd-screeners-copilot__context" aria-label="Current dashboard context">
        <span>{scope}</span><span>TOSREC</span><span>{period}</span>{school ? <span>{school}</span> : null}
      </div>
      <div className="hd-screeners-copilot__conversation">
        {messages.map((message, index) => <article className={message.role === 'user' ? 'is-user' : undefined} key={message.id}>
          {message.role === 'assistant' ? <span><Sparkles aria-hidden="true" /></span> : null}
          <div>
            {message.role === 'assistant' && index === 0 ? <strong>Ask about this dashboard</strong> : null}
            <p>{message.text}</p>
            {message.handoff ? <section className={`hd-screeners-copilot__handoff is-${message.handoff.status.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`}>
              <strong>{message.handoff.title ?? 'Work IQ handoff'}</strong>
              {message.handoff.message ? <p>{message.handoff.message}</p> : null}
              {message.handoff.status === 'RequiresConfirmation' && message.handoff.id ? <div className="hd-screeners-copilot__handoff-actions">
                <button className="is-primary" type="button" disabled={handoffBusyId === message.handoff.id} onClick={() => void resolveHandoff(message.id, message.handoff!, 'confirm')}>Confirm action</button>
                <button type="button" disabled={handoffBusyId === message.handoff.id} onClick={() => void resolveHandoff(message.id, message.handoff!, 'cancel')}>Cancel</button>
              </div> : <small>{message.handoff.status}</small>}
            </section> : null}
          </div>
        </article>)}
        {sending ? <article><span><LoaderCircle className="is-spinning" aria-hidden="true" /></span><div><p>Working with the governed Nexus context…</p></div></article> : null}
        {error ? <p className="hd-screeners-copilot__error" role="alert">{error}</p> : null}
        <div className="hd-screeners-copilot__suggestions">
          {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setDraft(suggestion)}>{suggestion}</button>)}
        </div>
      </div>
      <form className="hd-screeners-copilot__composer" onSubmit={(event) => { event.preventDefault(); void sendPrompt(draft) }}>
        <label htmlFor="screeners-copilot-prompt">Message Copilot</label>
        <div><textarea id="screeners-copilot-prompt" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about completion, schools, or follow-up…" /><button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" title="Send message">{sending ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <Send aria-hidden="true" />}</button></div>
        <small>Copilot uses your Nexus permissions and current filters. Active role: {role}.</small>
      </form>
    </aside>
  )
}

export function StudentScreenersDashboard({
  filtersOpen,
  setFiltersOpen,
  effectiveRole,
  studentDisplayMode,
  onContextChange,
}: Props) {
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [sectionGroup, setSectionGroup] = useState('')
  const [courseNumber, setCourseNumber] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [period, setPeriod] = useState(1)
  const [contextLoading, setContextLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contextRefreshVersion, setContextRefreshVersion] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [copilotOpen, setCopilotOpen] = useState(false)

  const activeRole = workspaceContext?.role ?? effectiveRole
  const requiresSchoolSelection = activeRole === 'Executive' || activeRole === 'Data Administrator'
  const awaitingSchoolSelection = requiresSchoolSelection && !schoolId
  const schoolOptions = workspaceContext?.schools ?? []

  useEffect(() => {
    const controller = new AbortController()
    setContextLoading(true)
    setError('')
    setWorkspaceContext(null)
    setDashboard(null)
    setCopilotOpen(false)
    getJson<WorkspaceContext>('/api/assessments/context', controller.signal)
      .then((context) => {
        const requiresExplicitSchool = context.role === 'Executive' || context.role === 'Data Administrator'
        const defaultSchool = requiresExplicitSchool
          ? ''
          : context.defaultSchoolId ?? (context.schools.length === 1 ? context.schools[0].id : '')
        setWorkspaceContext(context)
        setSchoolId(defaultSchool)
        setSectionGroup('')
        setCourseNumber('')
        setTeacherId('')
        setPeriod(1)
      })
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setContextLoading(false)
      })
    return () => controller.abort()
  }, [effectiveRole, contextRefreshVersion])

  useEffect(() => {
    if (!workspaceContext || (requiresSchoolSelection && !schoolId)) {
      setDashboard(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const query = new URLSearchParams({ assessmentType: 'TOSREC', period: String(period) })
    if (schoolId) query.set('schoolId', schoolId)
    if (sectionGroup) query.set('sectionGroup', sectionGroup)
    if (courseNumber) query.set('courseNumber', courseNumber)
    if (teacherId) query.set('teacherId', teacherId)
    setLoading(true)
    setError('')
    setDashboard(null)
    getJson<Dashboard>(`/api/assessments/dashboard?${query.toString()}`, controller.signal)
      .then(setDashboard)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [workspaceContext, requiresSchoolSelection, schoolId, sectionGroup, courseNumber, teacherId, period, refreshVersion])

  const selectedSchool = schoolOptions.find((school) => school.id === schoolId)?.name ?? ''
  const selectedCourse = dashboard?.courses.find((course) => course.value === courseNumber)?.label ?? ''
  const selectedTeacher = dashboard?.teachers.find((teacher) => teacher.value === teacherId)?.label ?? ''
  const breadcrumb = [selectedSchool, sectionGroup, selectedCourse, selectedTeacher, 'TOSREC'].filter(Boolean)
  useEffect(() => {
    onContextChange({ breadcrumb, filterCount: breadcrumb.length + (period === 1 ? 0 : 1) })
  }, [selectedSchool, sectionGroup, selectedCourse, selectedTeacher, period, onContextChange])

  const selectedPeriod = dashboard?.periods.find((item) => item.period === period)
    ?? dashboard?.periods[0]
  const selectedRate = selectedPeriod ? completionRate(selectedPeriod.completed, selectedPeriod.expected) : 0
  const selectedMissingCount = selectedPeriod ? Math.max(0, selectedPeriod.expected - selectedPeriod.completed) : 0
  const isDivisionRollup = dashboard?.scopeLabel === 'Division view' && !schoolId
  const [title, description] = dashboardHeading(dashboard?.role ?? activeRole, Boolean(schoolId))
  const accountabilityTitle = isDivisionRollup
    ? 'Schools needing attention'
    : dashboard?.role === 'School Administrator' || ((dashboard?.role === 'Executive' || dashboard?.role === 'Data Administrator') && Boolean(schoolId))
      ? 'Teacher follow-up'
      : 'Assigned student groups'
  const schoolLabel = schoolOptions.length === 1 ? schoolOptions[0].name : 'All permitted schools'
  const visibleMissing = useMemo(() => selectedPeriod?.missing.slice(0, 6) ?? [], [selectedPeriod])

  const resetFilters = () => {
    const defaultSchool = requiresSchoolSelection
      ? ''
      : workspaceContext?.defaultSchoolId ?? (schoolOptions.length === 1 ? schoolOptions[0].id : '')
    setSchoolId(defaultSchool)
    setSectionGroup('')
    setCourseNumber('')
    setTeacherId('')
    setPeriod(1)
    setCopilotOpen(false)
  }

  const retryLoad = () => {
    if (workspaceContext) setRefreshVersion((value) => value + 1)
    else setContextRefreshVersion((value) => value + 1)
  }

  return (
    <div className="hd-class-assignment hd-screeners-layout" data-filters={filtersOpen ? 'open' : 'closed'} data-dashboard-view={isDivisionRollup ? 'division' : 'detail'} data-copilot={copilotOpen ? 'open' : 'closed'}>
      <aside className="hd-filter-rail" id="student-screeners-filter-rail" aria-label="Student Screeners filters">
        <header className="hd-filter-rail__header">
          <div><span>Student Screeners</span><h2>Filters</h2></div>
          <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
        </header>
        <form className="hd-filter-rail__body">
          <label>
            <span>Dashboard View</span>
            <select value={audienceLabel(dashboard?.role ?? activeRole)} disabled>
              <option>{audienceLabel(dashboard?.role ?? activeRole)}</option>
            </select>
          </label>
          <label>
            <span>School</span>
            <select value={schoolId} disabled={contextLoading || schoolOptions.length === 0 || (!requiresSchoolSelection && schoolOptions.length <= 1)} onChange={(event) => {
              setSchoolId(event.target.value); setSectionGroup(''); setCourseNumber(''); setTeacherId('')
            }}>
              <option value="">{requiresSchoolSelection ? 'Select a permitted school' : schoolLabel}</option>
              {schoolOptions.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </label>
          <label>
            <span>Section Group</span>
            <select value={sectionGroup} disabled={!dashboard || loading} onChange={(event) => {
              setSectionGroup(event.target.value); setCourseNumber(''); setTeacherId('')
            }}>
              <option value="">All section groups</option>
              {(dashboard?.sectionGroups ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Course Name</span>
            <select value={courseNumber} disabled={!dashboard || loading} onChange={(event) => { setCourseNumber(event.target.value); setTeacherId('') }}>
              <option value="">All course names</option>
              {(dashboard?.courses ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Teacher</span>
            <select value={teacherId} disabled={!dashboard || loading} onChange={(event) => setTeacherId(event.target.value)}>
              <option value="">All teachers</option>
              {(dashboard?.teachers ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="hd-filter-rail__history">
            <span className="hd-filter-rail__history-title">Completion filters</span>
            <label><span>Assessment Type</span><select value="TOSREC" disabled><option>TOSREC</option></select></label>
            <label>
              <span>Assessment Period</span>
              <select value={period} disabled={!dashboard || loading} onChange={(event) => setPeriod(Number(event.target.value))}>
                <option value={1}>Fall</option><option value={2}>Winter</option><option value={3}>Spring</option>
              </select>
            </label>
          </div>
        </form>
        <footer className="hd-filter-rail__footer"><button type="button" onClick={resetFilters}><RotateCcw aria-hidden="true" /> Reset filters</button></footer>
      </aside>

      <section className="hd-class-assignment__content hd-screeners-dashboard" aria-labelledby="student-screeners-dashboard-heading">
        <header className="hd-screeners-dashboard__heading">
          <div><span>Actions dashboard</span><h1 id="student-screeners-dashboard-heading">{title}</h1><p>{description}</p></div>
          <div className="hd-screeners-dashboard__heading-actions"><span>{awaitingSchoolSelection ? 'School required' : dashboard?.scopeLabel ?? 'Governed view'}</span><button type="button" disabled={!dashboard || loading} className={copilotOpen ? 'is-active hd-copilot-trigger' : 'hd-copilot-trigger'} aria-label={copilotOpen ? 'Close Copilot' : 'Open Copilot'} title={!dashboard ? 'Select a school before opening Copilot' : copilotOpen ? 'Close Copilot' : 'Open Copilot'} aria-expanded={copilotOpen} aria-controls="student-screeners-copilot" onClick={() => setCopilotOpen((open) => !open)}><Sparkles aria-hidden="true" /><span>Copilot</span></button><button type="button" disabled={loading || contextLoading || awaitingSchoolSelection} onClick={() => setRefreshVersion((value) => value + 1)}><RefreshCw className={loading || contextLoading ? 'is-spinning' : undefined} aria-hidden="true" /> Refresh</button></div>
        </header>

        {error ? <div className="hd-screeners-dashboard__error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span><button type="button" onClick={retryLoad}>Try again</button></div> : null}
        {contextLoading ? <div className="hd-screeners-dashboard__loading" role="status"><LoaderCircle className="is-spinning" aria-hidden="true" /> Loading permitted schools…</div> : null}
        {!contextLoading && !error && awaitingSchoolSelection ? <div className="hd-live-workspace-state hd-screeners-dashboard__school-prompt" role="status"><School aria-hidden="true" /><div><strong>Select a permitted school</strong><span>Nexus will load completion records, recommended actions, and student follow-up only after you make a selection.</span></div></div> : null}
        {!contextLoading && !dashboard && loading ? <div className="hd-screeners-dashboard__loading" role="status"><LoaderCircle className="is-spinning" aria-hidden="true" /> Loading school screener data…</div> : null}
        {dashboard ? (
          <div className="hd-screeners-dashboard__body" aria-busy={loading}>
            <section className="hd-screeners-summary" aria-label="Completion summary">
              <article><span>Eligible students</span><strong>{selectedPeriod?.expected ?? 0}</strong><small>Current filtered roster</small><UsersRound aria-hidden="true" /></article>
              <article className="is-complete"><span>Completed</span><strong>{selectedPeriod?.completed ?? 0}</strong><small>{selectedPeriod?.label} · TOSREC</small><CheckCircle2 aria-hidden="true" /></article>
              <article className="is-missing"><span>Missing</span><strong>{selectedMissingCount}</strong><small>Require follow-up</small><AlertTriangle aria-hidden="true" /></article>
              <article><span>Completion rate</span><strong>{selectedRate}%</strong><small>Target 95%</small><BarChart3 aria-hidden="true" /></article>
            </section>

            <div className="hd-screeners-dashboard__workspace">
              <div className="hd-screeners-dashboard__detail">
            <section className="hd-screeners-periods" aria-labelledby="screeners-periods-heading">
              <header><div><span>Assessment windows</span><h2 id="screeners-periods-heading">Completion by period</h2></div><small>{dashboard.schoolYear}</small></header>
              <div>{dashboard.periods.map((item) => {
                const rate = completionRate(item.completed, item.expected)
                return <button type="button" key={item.period} className={period === item.period ? 'is-active' : undefined} onClick={() => setPeriod(item.period)}>
                  <span><strong>{item.label}</strong><small>{item.period === period ? 'Selected window' : 'Assessment window'}</small></span>
                  <span><strong>{item.completed}</strong> of {item.expected} complete</span>
                  <span className="hd-screeners-periods__track"><i style={{ inlineSize: `${rate}%` }} /></span>
                  <span>{Math.max(0, item.expected - item.completed)} missing · {rate}% complete</span>
                </button>
              })}</div>
            </section>

            <div className="hd-screeners-dashboard__columns">
              <section className="hd-screeners-actions" aria-labelledby="recommended-actions-heading">
                <header><div><span>Recommended actions</span><h2 id="recommended-actions-heading">What needs attention</h2></div><strong>{dashboard.recommendedActions.length} actions</strong></header>
                <div>{dashboard.recommendedActions.length === 0 ? <article><span><CheckCircle2 aria-hidden="true" /></span><div><strong>No immediate follow-up</strong><small>The selected scope has no outstanding completion actions.</small></div></article> : dashboard.recommendedActions.map((action, index) => <article key={action.title}>
                  <span className={index === 0 && action.kind === 'missing' ? 'is-high' : undefined}>{action.kind === 'missing' ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
                  <div><strong>{action.title}</strong><small>{action.detail}</small></div><span>{action.priority}</span><button type="button" aria-label={`Review ${action.title}`}><ChevronRight aria-hidden="true" /></button>
                </article>)}</div>
              </section>
              <section className="hd-screeners-accountability" aria-labelledby="screeners-accountability-heading">
                <header><div><span>Accountability</span><h2 id="screeners-accountability-heading">{accountabilityTitle}</h2></div><small>{selectedPeriod?.label}</small></header>
                <div>{dashboard.accountability.length === 0
                  ? <p className="hd-screeners-accountability__empty">All schools in the selected scope meet the 95% completion target.</p>
                  : dashboard.accountability.map((item) => <button type="button" key={item.id} onClick={isDivisionRollup ? () => {
                    setSchoolId(item.id); setSectionGroup(''); setCourseNumber(''); setTeacherId('')
                  } : undefined} disabled={!isDivisionRollup} title={isDivisionRollup ? `Open ${item.label}` : undefined}>
                    <span><strong>{item.label}</strong><span>{item.completionRate}%</span></span>
                    <span><i style={{ inlineSize: `${item.completionRate}%` }} /></span>
                    {isDivisionRollup ? <small>{item.missing} missing · Select for details</small> : null}
                  </button>)}</div>
              </section>
            </div>

            {isDivisionRollup ? (
              <aside className="hd-screeners-rollup-guidance">
                <UsersRound aria-hidden="true" />
                <div><strong>Student follow-up is available at school level</strong><span>Select an exception school above or use the School filter to load teacher and student detail.</span></div>
              </aside>
            ) : (
              <section className="hd-screeners-missing" aria-labelledby="missing-students-heading">
                <header><div><span>Student follow-up</span><h2 id="missing-students-heading">{selectedPeriod?.label} · Missing students ({selectedMissingCount})</h2></div>{selectedMissingCount > visibleMissing.length ? <button type="button">View all missing <ChevronRight aria-hidden="true" /></button> : null}</header>
                <div>{visibleMissing.length === 0 ? <article><div><strong>No missing students</strong><span>The selected scope is complete for this assessment window.</span></div></article> : visibleMissing.map((student) => <article key={student.id}><div><strong>{studentDisplayMode === 'obfuscated' ? student.obfuscatedName ?? student.name : student.name}</strong><span>{student.grade ?? 'Grade not recorded'} · ASN {studentDisplayMode === 'obfuscated' ? student.obfuscatedAsn ?? student.asn ?? '—' : student.asn ?? '—'}</span></div><span>Result missing</span><button type="button">Review <ChevronRight aria-hidden="true" /></button></article>)}</div>
              </section>
            )}
              </div>
              {copilotOpen ? <ScreenersCopilotRail
                key={`${dashboard.scopeLabel}|${selectedPeriod?.period}|${schoolId}|${sectionGroup}|${courseNumber}|${teacherId}|${dashboard.assessmentType}|${studentDisplayMode}`}
                scope={dashboard.scopeLabel}
                role={dashboard.role}
                period={selectedPeriod?.label ?? 'Current period'}
                school={selectedSchool}
                assessmentType={dashboard.assessmentType}
                eligible={selectedPeriod?.expected ?? 0}
                completed={selectedPeriod?.completed ?? 0}
                missing={selectedMissingCount}
                completion={selectedRate}
                schoolId={schoolId}
                sectionGroup={sectionGroup}
                courseNumber={courseNumber}
                teacherId={teacherId}
                assessmentPeriod={selectedPeriod?.period ?? period}
                obfuscateStudentData={studentDisplayMode === 'obfuscated'}
                onClose={() => setCopilotOpen(false)}
              /> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
