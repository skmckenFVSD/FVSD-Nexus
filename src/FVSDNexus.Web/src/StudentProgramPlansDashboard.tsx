import { useEffect, useState } from 'react'
import { AlertTriangle, Archive, BarChart3, CheckCircle2, ChevronRight, Clock3, Eye, Files, FileText, LayoutGrid, Pencil, RefreshCw, RotateCcw, Signature, X } from 'lucide-react'
import { EmpowerClassOverview } from './EmpowerClassOverview'
import type { IppPreviewContext } from './IppPreview'
import { buildProgramPlansView, type ProgramPlansData, type ProgramPlanStatus } from './programPlansDashboardModel'

type WorkspaceContext = {
  role: string
  schools: Array<{ id: string; name: string }>
  defaultSchoolId: string | null
  schoolSelectionEnabled: boolean
}
type Props = {
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  effectiveRole: string
  scopeKey: string
  currentSchoolYear: string
  studentDisplayMode: 'real' | 'obfuscated'
  onContextChange: (context: { breadcrumb: string[]; filterCount: number }) => void
  onOpenIpp: (context: IppPreviewContext) => void
}
async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store', signal })
  if (response.status === 401 || (response.redirected && !response.headers.get('content-type')?.includes('application/json'))) {
    throw new Error('Reconnect your Microsoft session to load Student Program Plans.')
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.title ?? problem?.error ?? `Request failed (${response.status})`)
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The Student Program Plans API returned a page instead of data. Restart the local API to load the current endpoints, then select Refresh.')
  }
  return response.json()
}

export function StudentProgramPlansDashboard({ filtersOpen, setFiltersOpen, effectiveRole, scopeKey, currentSchoolYear, studentDisplayMode, onContextChange, onOpenIpp }: Props) {
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [sectionGroupFilter, setSectionGroupFilter] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [programPlanSchoolYear, setProgramPlanSchoolYear] = useState(currentSchoolYear)
  const [programPlanStatusFilter, setProgramPlanStatusFilter] = useState<ProgramPlanStatus>('All statuses')
  const [data, setData] = useState<ProgramPlansData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [classOverviewOpen, setClassOverviewOpen] = useState(false)
  const programPlansAudience = effectiveRole === 'Executive' || effectiveRole === 'Data Administrator' ? 'executive' : effectiveRole === 'School Administrator' ? 'school-admin' : 'teacher'
  const startYear = Number(currentSchoolYear.slice(0, 4))
  const schoolYears = [0, 1, 2].map((offset) => `${startYear - offset} / ${startYear - offset + 1}`)

  useEffect(() => {
    const controller = new AbortController()
    setContext(null)
    setData(null)
    setLoading(true)
    setError('')
    getJson<WorkspaceContext>('/api/assessments/context', controller.signal).then((value) => {
      if (controller.signal.aborted) return
      setSchoolId(value.defaultSchoolId ?? '')
      setSectionGroupFilter('')
      setTeacherId('')
      setContext(value)
    }).catch((reason: Error) => {
      if (!controller.signal.aborted) { setError(reason.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [effectiveRole, scopeKey])

  useEffect(() => {
    if (!context) return
    const controller = new AbortController()
    setData(null)
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ schoolYear: programPlanSchoolYear })
    if (schoolId) query.set('schoolId', schoolId)
    getJson<ProgramPlansData>(`/api/program-plans/dashboard?${query}`, controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value)
    }).catch((reason: Error) => {
      if (!controller.signal.aborted) setError(reason.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [context, schoolId, programPlanSchoolYear, refresh])

  const sections = data?.sections ?? []
  const sectionGroups = [...new Set(sections.map((section) => section.sectionGroup))].sort()
  const teacherOptions = [...new Map(sections.filter((section) => !sectionGroupFilter || section.sectionGroup === sectionGroupFilter)
    .map((section) => [section.teacherId, section])).values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName))
  useEffect(() => {
    if (!data) return
    if (sectionGroupFilter && !sectionGroups.includes(sectionGroupFilter)) { setSectionGroupFilter(''); setTeacherId('') }
    else if (teacherId && !teacherOptions.some((teacher) => teacher.teacherId === teacherId)) setTeacherId('')
  }, [data, sectionGroupFilter, teacherId])

  const { visibleProgramPlanQueue, statusCounts, programPlansView } = buildProgramPlansView(data, {
    schoolId, sectionGroup: sectionGroupFilter, teacherId, schoolYear: programPlanSchoolYear,
    status: programPlanStatusFilter, audience: programPlansAudience, obfuscated: studentDisplayMode === 'obfuscated',
  })
  const schoolName = context?.schools.find((school) => school.id === schoolId)?.name ?? ''
  const teacherName = teacherOptions.find((teacher) => teacher.teacherId === teacherId)?.teacherName ?? ''
  const singleTeacherSelected = Boolean(teacherId && teacherName)
  useEffect(() => {
    setClassOverviewOpen(false)
  }, [schoolId, teacherId, sectionGroupFilter, programPlanSchoolYear])
  useEffect(() => {
    const breadcrumb = [schoolName, sectionGroupFilter, teacherName, programPlanStatusFilter === 'All statuses' ? '' : programPlanStatusFilter].filter(Boolean)
    onContextChange({ breadcrumb, filterCount: breadcrumb.length + (programPlanSchoolYear !== currentSchoolYear ? 1 : 0) })
  }, [schoolName, sectionGroupFilter, teacherName, programPlanStatusFilter, programPlanSchoolYear, currentSchoolYear, onContextChange])

  return (
          <div className="hd-class-assignment hd-program-plans-layout" data-filters={filtersOpen ? 'open' : 'closed'}>
            <aside className="hd-filter-rail" id="student-program-plans-filter-rail" aria-label="Student Program Plans filters">
              <header className="hd-filter-rail__header">
                <div><span>Student Program Plans</span><h2>Filters</h2></div>
                <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
              </header>
              <form className="hd-filter-rail__body" onSubmit={(event) => event.preventDefault()}>
                <label>
                  <span>Dashboard View</span>
                  <select value={programPlansAudience} disabled>
                    <option value="executive">Executive / Data Administrator</option>
                    <option value="school-admin">School Administrator</option>
                    <option value="teacher">Teacher / Support Staff</option>
                  </select>
                </label>
                <label>
                  <span>School</span>
                  <select value={schoolId} disabled={!context || !context.schoolSelectionEnabled} onChange={(event) => { setSchoolId(event.target.value); setSectionGroupFilter(''); setTeacherId('') }}>
                    <option value="">All permitted schools</option>
                    {context?.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Section Group</span>
                  <select value={sectionGroupFilter} onChange={(event) => { setSectionGroupFilter(event.target.value); setTeacherId('') }}>
                    <option value="">All section groups</option>
                    {sectionGroups.map((group) => <option key={group}>{group}</option>)}
                  </select>
                </label>
                <label>
                  <span>Teacher</span>
                  <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
                    <option value="">All teachers</option>
                    {teacherOptions.map((teacher) => <option key={teacher.teacherId} value={teacher.teacherId}>{teacher.teacherName}</option>)}
                  </select>
                </label>
                <div className="hd-filter-rail__history">
                  <span className="hd-filter-rail__history-title">Plan filters</span>
                  <label>
                    <span>School Year</span>
                    <select value={programPlanSchoolYear} onChange={(event) => setProgramPlanSchoolYear(event.target.value)}>
                      {schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Plan Status</span>
                    <select value={programPlanStatusFilter} onChange={(event) => setProgramPlanStatusFilter(event.target.value as ProgramPlanStatus)}>
                      <option>All statuses</option><option>Draft</option><option>Principal Review</option><option>Awaiting Signatures</option><option>Signed</option><option>Archived</option>
                    </select>
                  </label>
                </div>
              </form>
              <footer className="hd-filter-rail__footer">
                <button type="button" onClick={() => {
                  setSchoolId(context?.defaultSchoolId ?? '')
                  setSectionGroupFilter('')
                  setTeacherId('')
                  setProgramPlanSchoolYear(currentSchoolYear)
                  setProgramPlanStatusFilter('All statuses')
                }}>
                  <RotateCcw aria-hidden="true" /><span>Reset filters</span>
                </button>
              </footer>
            </aside>

            <section className="hd-screeners-dashboard hd-program-plans-dashboard" aria-labelledby="student-program-plans-dashboard-heading">
              <header className="hd-screeners-dashboard__heading">
                <div>
                  <span>Actions dashboard</span>
                  <h1 id="student-program-plans-dashboard-heading">{programPlansView.title}</h1>
                  <p>{programPlansView.description}</p>
                </div>
                <div className="hd-screeners-dashboard__heading-actions">
                  <span>{programPlansView.scope}</span>
                  <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}><RefreshCw aria-hidden="true" /> Refresh</button>
                </div>
              </header>

              <div className="hd-screeners-dashboard__body">
                {error ? <div className="hd-live-workspace-state is-error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div> : null}
                {loading ? <div className="hd-live-workspace-state" role="status"><RefreshCw aria-hidden="true" /><span>Loading Student Program Plans…</span></div> : null}
                {!loading && !error ? <>
                <section className="hd-screeners-summary" aria-label="Student Program Plan summary">
                  <article><span>Active plans</span><strong>{programPlansView.active}</strong><small>{programPlanSchoolYear}</small><Files aria-hidden="true" /></article>
                  <article className="is-missing"><span>Need attention</span><strong>{programPlansView.attention}</strong><small>Review or follow-up required</small><AlertTriangle aria-hidden="true" /></article>
                  <article className="is-complete"><span>Signed</span><strong>{programPlansView.signed}</strong><small>Returned from DocuSign</small><CheckCircle2 aria-hidden="true" /></article>
                  <article><span>Signed rate</span><strong>{programPlansView.rate}%</strong><small>Current active plans</small><BarChart3 aria-hidden="true" /></article>
                </section>

                <section className="hd-program-plan-statuses" aria-labelledby="program-plan-status-heading">
                  <header><div><span>Plan lifecycle</span><h2 id="program-plan-status-heading">Status pipeline</h2></div><small>{programPlanSchoolYear}</small></header>
                  <div>
                    {([
                      ['Draft', statusCounts['Draft'], Pencil],
                      ['Principal Review', statusCounts['Principal Review'], Eye],
                      ['Awaiting Signatures', statusCounts['Awaiting Signatures'], Signature],
                      ['Signed', statusCounts['Signed'], CheckCircle2],
                      ['Archived', statusCounts['Archived'], Archive],
                    ] as const).map(([status, count, StatusIcon]) => (
                      <button type="button" key={status} className={`is-${status.toLowerCase().replaceAll(' ', '-')}${programPlanStatusFilter === status ? ' is-active' : ''}`} onClick={() => setProgramPlanStatusFilter(programPlanStatusFilter === status ? 'All statuses' : status)}>
                        <span><StatusIcon aria-hidden="true" /></span>
                        <strong>{count}</strong>
                        <small>{status}</small>
                        <ChevronRight aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>

                <div className="hd-screeners-dashboard__columns">
                  <section className="hd-screeners-actions" aria-labelledby="program-plan-actions-heading">
                    <header><div><span>Recommended actions</span><h2 id="program-plan-actions-heading">What needs attention</h2></div><strong>{programPlansView.actions.length} actions</strong></header>
                    <div>
                      {programPlansView.actions.map(([title, priority, detail, status], index) => (
                        <article key={title}>
                          <span className={index === 0 ? 'is-high' : undefined}>{index === 0 ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
                          <div><strong>{title}</strong><small>{detail}</small></div>
                          <span>{priority}</span>
                          <button type="button" onClick={() => setProgramPlanStatusFilter(status)} aria-label={`Review ${title}`}><ChevronRight aria-hidden="true" /></button>
                        </article>
                      ))}
                      {!programPlansView.actions.length ? <p>No plans need attention for the selected filters.</p> : null}
                    </div>
                  </section>

                  <section className="hd-screeners-accountability" aria-labelledby="program-plan-accountability-heading">
                    <header><div><span>Accountability</span><h2 id="program-plan-accountability-heading">{programPlansView.accountabilityTitle}</h2></div><small>Signed</small></header>
                    <div>
                      {programPlansView.accountability.map(([label, value, rate]) => (
                        <article key={label}><div><strong>{label}</strong><span>{value}</span></div><span><i style={{ inlineSize: `${rate}%` }} /></span></article>
                      ))}
                      {!programPlansView.accountability.length ? <p>No matching plans.</p> : null}
                    </div>
                  </section>
                </div>

                <section className="hd-program-plan-queue" aria-labelledby="program-plan-queue-heading">
                  <header>
                    <div><span>Plan work queue</span><h2 id="program-plan-queue-heading">Plans in Progress</h2></div>
                    <div className="hd-program-plan-queue__header-actions">
                      <strong>{visibleProgramPlanQueue.length} {visibleProgramPlanQueue.length === 1 ? 'plan' : 'plans'}</strong>
                      {singleTeacherSelected ? (
                        <button type="button" onClick={() => setClassOverviewOpen(true)} aria-haspopup="dialog"><LayoutGrid aria-hidden="true" /> Class Overview</button>
                      ) : null}
                    </div>
                  </header>
                  <div className="hd-program-plan-queue__scroll" tabIndex={0} role="region" aria-label="Plans in Progress list">
                    {visibleProgramPlanQueue.length ? visibleProgramPlanQueue.map((plan) => (
                      <article key={plan.id}>
                        <div><strong>{plan.student}</strong><small>{plan.grade} · {plan.school}</small></div>
                        <span><small>Teacher</small><strong>{plan.teacher}</strong></span>
                        <span><small>Last updated</small><strong>{plan.updated}</strong></span>
                        <em className={`is-${plan.status.toLowerCase().replaceAll(' ', '-')}`}>{plan.status}</em>
                        <button type="button" onClick={() => onOpenIpp(plan.context)}><Eye aria-hidden="true" /> Open</button>
                      </article>
                    )) : (
                      <div className="hd-program-plan-queue__empty"><FileText aria-hidden="true" /><span><strong>No matching plans</strong><small>Change the school, section group, teacher, school year, or status filters to find plans.</small></span></div>
                    )}
                  </div>
                </section>
                </> : null}
              </div>
            </section>
            <EmpowerClassOverview
              open={classOverviewOpen && singleTeacherSelected}
              onClose={() => setClassOverviewOpen(false)}
              schoolId={schoolId}
              teacherId={teacherId}
              teacherName={teacherName}
              sectionGroup={sectionGroupFilter}
              schoolYear={programPlanSchoolYear}
              studentDisplayMode={studentDisplayMode}
            />
          </div>
  )
}
