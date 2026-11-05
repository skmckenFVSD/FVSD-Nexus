import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FilePlus2,
  LockKeyhole,
  PanelsTopLeft,
  Plus,
  RefreshCw,
  Signature,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { IppPreviewContext } from './IppPreview'

type StudentPlanHistoryRecord = {
  id: string
  name: string
  schoolYear: string
}

type StudentPlanModule = {
  id: string
  name: string
  group: string
  description: string
  frontFacingDescription: string
  sortOrder: number
  selected: boolean
  available: boolean
  locksWhenSelected: boolean
  locked: boolean
  canRemove: boolean
  stateReason?: string | null
}

type StudentPlanDetails = {
  schoolYear: string
  gradeAtPlan?: string | null
  schoolAtPlan?: string | null
  courseName?: string | null
  teacherAtPlan?: string | null
  principalAtPlan?: string | null
  parentOrGuardianName?: string | null
  fallAttendance?: number | null
  winterAttendance?: number | null
  springAttendance?: number | null
  modifiedOn?: string | null
}

type StudentPlanModulesResponse = {
  planId: string
  eTag: string
  details: StudentPlanDetails
  modules: StudentPlanModule[]
}

type StudentPlanScreenerResult = {
  assessmentType: string
  period: string
  periodSortOrder: number
  assessmentDate?: string | null
  standardScore?: number | null
  descriptiveTerm?: string | null
  descriptiveTermFill?: string | null
  descriptiveTermFont?: string | null
}

type StudentPlanScreenersResponse = {
  planId: string
  schoolYear: string
  results: StudentPlanScreenerResult[]
}

type StudentPlanIntervention = {
  id: string
  interventionType: string
  interventionist?: string | null
  teacher?: string | null
  school?: string | null
  grade?: string | null
  curriculum?: string | null
  dateStarted?: string | null
  dateWithdrawn?: string | null
  withdrawnReason?: string | null
  additionalInformation?: string | null
}

type StudentPlanInterventionsResponse = {
  planId: string
  schoolYear: string
  interventions: StudentPlanIntervention[]
}

type ProblemDetails = {
  title?: string
  detail?: string
}

async function readError(response: Response) {
  try {
    const problem = await response.json() as ProblemDetails
    return problem.title ?? problem.detail ?? `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

function normalizePlanDescription(value: string) {
  return value.replaceAll('Individual Program Plan', 'Individual Education Plan')
}

function formatAttendance(value?: number | null) {
  if (value === null || value === undefined) return '—'
  return `${new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 }).format(value)}%`
}

function formatPlanDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function IppWorkspace({ context, onBackToClassAssignment }: {
  context: IppPreviewContext
  onBackToClassAssignment: () => void
}) {
  const [planId, setPlanId] = useState(context.planId)
  const [moduleState, setModuleState] = useState<StudentPlanModulesResponse | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [loading, setLoading] = useState(Boolean(context.planId))
  const [creating, setCreating] = useState(false)
  const [changingModuleId, setChangingModuleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [screeners, setScreeners] = useState<StudentPlanScreenersResponse | null>(null)
  const [screenersLoading, setScreenersLoading] = useState(false)
  const [screenersError, setScreenersError] = useState<string | null>(null)
  const [interventions, setInterventions] = useState<StudentPlanInterventionsResponse | null>(null)
  const [interventionsLoading, setInterventionsLoading] = useState(false)
  const [interventionsError, setInterventionsError] = useState<string | null>(null)

  const loadModules = async (id: string, signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${id}/modules`,
        { credentials: 'include', signal },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanModulesResponse
      setModuleState(next)
      setActiveModuleId((current) => next.modules.some((module) => module.selected && module.id === current)
        ? current
        : next.modules.find((module) => module.selected)?.id ?? null)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'The plan modules could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPlanId(context.planId)
    setModuleState(null)
    setActiveModuleId(null)
    setManageOpen(false)
    setError(null)
    setNotice(null)
    setScreeners(null)
    setScreenersError(null)
    setInterventions(null)
    setInterventionsError(null)
  }, [context.planId, context.studentId, context.teacherSectionId])

  useEffect(() => {
    if (!planId) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void loadModules(planId, controller.signal)
    return () => controller.abort()
  }, [planId, context.studentId, context.teacherSectionId])

  const selectedModules = useMemo(
    () => moduleState?.modules.filter((module) => module.selected) ?? [],
    [moduleState],
  )
  const activeModule = selectedModules.find((module) => module.id === activeModuleId) ?? selectedModules[0]
  const activeModuleDescription = activeModule
    ? normalizePlanDescription(activeModule.frontFacingDescription || activeModule.description)
    : ''

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Screener Results' || screeners?.planId === planId) return
    const controller = new AbortController()
    setScreenersLoading(true)
    setScreenersError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/screeners`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setScreeners(await response.json() as StudentPlanScreenersResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setScreenersError(requestError instanceof Error ? requestError.message : 'Screener results could not be loaded.')
    }).finally(() => setScreenersLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, screeners?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Intervention Focus' || interventions?.planId === planId) return
    const controller = new AbortController()
    setInterventionsLoading(true)
    setInterventionsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/interventions`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setInterventions(await response.json() as StudentPlanInterventionsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setInterventionsError(requestError instanceof Error ? requestError.message : 'Interventions could not be loaded.')
    }).finally(() => setInterventionsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, interventions?.planId, planId])
  const moduleGroups = useMemo(() => {
    const groups = new Map<string, StudentPlanModule[]>()
    for (const module of moduleState?.modules ?? []) {
      const entries = groups.get(module.group) ?? []
      entries.push(module)
      groups.set(module.group, entries)
    }
    return [...groups.entries()]
  }, [moduleState])

  const createPlan = async () => {
    setCreating(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans`,
        { method: 'POST', credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const plan = await response.json() as StudentPlanHistoryRecord
      setPlanId(plan.id)
      setNotice(`The ${plan.schoolYear} annual plan was created with its required modules.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The annual plan could not be created.')
    } finally {
      setCreating(false)
    }
  }

  const changeModule = async (module: StudentPlanModule, add: boolean) => {
    if (!planId || !moduleState) return
    if (add && module.locksWhenSelected && !window.confirm(
      `${module.name} is configured to lock after it is added. Add it to this annual plan?`,
    )) return
    if (!add && !window.confirm(
      `Remove ${module.name} from this plan? Its source records will not be deleted.`,
    )) return

    setChangingModuleId(module.id)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/modules/${module.id}`,
        {
          method: add ? 'PUT' : 'DELETE',
          credentials: 'include',
          headers: { 'If-Match': moduleState.eTag },
        },
      )
      if (!response.ok) {
        const message = await readError(response)
        if (response.status === 409) {
          await loadModules(planId)
          throw new Error(`${message} The current module selection has been reloaded.`)
        }
        throw new Error(message)
      }
      const next = await response.json() as StudentPlanModulesResponse
      setModuleState(next)
      if (add) {
        setActiveModuleId(module.id)
        setNotice(`${module.name} was added to the plan.`)
      } else {
        setActiveModuleId((current) => current === module.id
          ? next.modules.find((item) => item.selected)?.id ?? null
          : current)
        setNotice(`${module.name} was removed from the plan.`)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The module selection could not be saved.')
    } finally {
      setChangingModuleId(null)
    }
  }

  if (!planId) {
    return (
      <section className="ipp-workspace" aria-labelledby="ipp-workspace-title">
        <div className="ipp-workspace-topbar">
          <button type="button" className="ipp-back-button" onClick={onBackToClassAssignment}>
            <ArrowLeft size={16} /> Class Assignment
          </button>
          <span className="ipp-workspace-status">New annual plan</span>
        </div>
        <article className="ipp-create-card">
          <div className="ipp-create-icon"><FilePlus2 size={28} /></div>
          <span className="eyebrow">Individual Education / Program Plan</span>
          <h2 id="ipp-workspace-title">Create {context.studentName}&apos;s annual plan?</h2>
          <p>This creates one master plan for {context.schoolYear ?? 'the current school year'} and adds the required Student Details and Screener Results modules. Student Conditions and Coding is also added automatically when the student is SPED Coded.</p>
          <dl className="ipp-create-context">
            <div><dt>Student</dt><dd>{context.studentName}</dd></div>
            <div><dt>Grade</dt><dd>{context.grade ?? 'Not recorded'}</dd></div>
            <div><dt>School</dt><dd>{context.schoolName ?? 'Not recorded'}</dd></div>
            <div><dt>Class</dt><dd>{context.courseName ?? 'Not recorded'}</dd></div>
          </dl>
          {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}
          <div className="ipp-create-actions">
            <button type="button" className="outline-button" onClick={onBackToClassAssignment}>Cancel</button>
            <button type="button" className="primary-button" onClick={() => void createPlan()} disabled={creating}>
              {creating ? <RefreshCw className="spin" size={17} /> : <FilePlus2 size={17} />}
              {creating ? 'Creating annual plan…' : 'Create annual plan'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="ipp-workspace" aria-label={`${context.studentName} annual plan`}>
      <div className="ipp-workspace-topbar">
        <button type="button" className="ipp-back-button" onClick={onBackToClassAssignment}>
          <ArrowLeft size={16} /> Class Assignment
        </button>
        <span className="ipp-workspace-status">{context.schoolYear ?? 'Current year'} · Annual plan</span>
      </div>

      {notice ? <div className="ipp-success-banner" role="status"><Check size={17} />{notice}</div> : null}
      {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}

      <section className="ipp-module-shell" aria-label="Annual plan modules">
        <div className="ipp-module-navigation-heading">
          <div>
            <span className="eyebrow">Plan sections</span>
            <strong>{selectedModules.length} modules in this plan</strong>
          </div>
          <button
            type="button"
            className={manageOpen ? 'ipp-manage-button active' : 'ipp-manage-button'}
            aria-expanded={manageOpen}
            onClick={() => setManageOpen((current) => !current)}
          >
            <PanelsTopLeft size={16} /> Manage modules {manageOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {loading && !moduleState ? <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading plan modules…</div> : (
          <nav className="ipp-module-tabs" aria-label="Selected plan modules">
            {selectedModules.map((module) => (
              <button
                type="button"
                key={module.id}
                className={module.id === activeModule?.id ? 'active' : ''}
                aria-current={module.id === activeModule?.id ? 'page' : undefined}
                onClick={() => setActiveModuleId(module.id)}
              >
                {module.locked ? <LockKeyhole size={13} aria-label="Locked" /> : null}
                <span>{module.name}</span>
              </button>
            ))}
          </nav>
        )}

        {manageOpen && moduleState ? (
          <div className="ipp-module-manager">
            <div className="ipp-module-manager-heading">
              <div>
                <h3>Choose plan modules</h3>
                <p>Adding or removing a module changes this plan&apos;s structure. Opening a module above does not change the selection.</p>
              </div>
              <label className="ipp-description-toggle">
                <input type="checkbox" checked={showDescriptions} onChange={(event) => setShowDescriptions(event.target.checked)} />
                Show full descriptions
              </label>
            </div>
            <div className="ipp-module-groups">
              {moduleGroups.map(([group, modules]) => (
                <section key={group} className="ipp-module-group">
                  <h4>{group}</h4>
                  <div className="ipp-module-options">
                    {modules.map((module) => (
                      <article className={`ipp-module-option${module.selected ? ' selected' : ''}`} key={module.id}>
                        <div className="ipp-module-option-copy">
                          <div className="ipp-module-option-title">
                            <strong>{module.name}</strong>
                            {module.locked ? <span><LockKeyhole size={12} /> Locked</span> : module.selected ? <span><Check size={12} /> Included</span> : null}
                          </div>
                          {(showDescriptions ? module.description : module.frontFacingDescription || module.description) ? (
                            <p>{showDescriptions ? module.description : module.frontFacingDescription || module.description}</p>
                          ) : null}
                          {module.stateReason ? <small>{module.stateReason}</small> : null}
                        </div>
                        {module.selected ? (
                          <button
                            type="button"
                            className="ipp-module-remove"
                            disabled={!module.canRemove || changingModuleId === module.id}
                            onClick={() => void changeModule(module, false)}
                          >
                            {changingModuleId === module.id ? <RefreshCw className="spin" size={15} /> : module.locked ? <LockKeyhole size={15} /> : <Trash2 size={15} />}
                            {module.locked ? 'Required' : 'Remove'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ipp-module-add"
                            disabled={!module.available || changingModuleId === module.id}
                            onClick={() => void changeModule(module, true)}
                          >
                            {changingModuleId === module.id ? <RefreshCw className="spin" size={15} /> : <Plus size={15} />}
                            Add
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {activeModule ? (
        <article className="ipp-active-module">
          <header>
            <div className="ipp-active-module-icon">
              {activeModule.name === 'Screener Results'
                ? <ChartNoAxesCombined size={20} />
                : activeModule.name === 'Intervention Focus'
                  ? <Target size={20} />
                : activeModule.name === 'Signatures'
                  ? <Signature size={20} />
                  : <UserRound size={20} />}
            </div>
            <div>
              <h3>{activeModule.name}</h3>
            </div>
            {activeModule.locked ? <strong><LockKeyhole size={13} /> Locked in plan</strong> : null}
          </header>
          {activeModule.name === 'Student Details' ? (
            <StudentDetailsDocument
              context={context}
              details={moduleState?.details}
              description={activeModuleDescription}
            />
          ) : activeModule.name === 'Screener Results' ? (
            <ScreenerResultsDocument
              description={activeModuleDescription}
              response={screeners}
              loading={screenersLoading}
              error={screenersError}
            />
          ) : activeModule.name === 'Signatures' ? (
            <SignaturesDocument
              description={activeModuleDescription}
              details={moduleState?.details}
            />
          ) : activeModule.name === 'Intervention Focus' ? (
            <InterventionFocusDocument
              description={activeModuleDescription}
              response={interventions}
              loading={interventionsLoading}
              error={interventionsError}
            />
          ) : (
            <div className="ipp-module-document-body">
              {activeModuleDescription ? <p className="ipp-module-front-description">{activeModuleDescription}</p> : null}
              <div className="ipp-module-content-placeholder">
                <PanelsTopLeft size={24} />
                <div>
                  <strong>{activeModule.name} is now part of this annual plan.</strong>
                  <span>The section renderer and its governed source records will be connected as that module is migrated from the Power App.</span>
                </div>
              </div>
            </div>
          )}
        </article>
      ) : !loading ? (
        <div className="ipp-module-content-placeholder"><CircleAlert size={22} /><span>No selected module is available to open.</span></div>
      ) : null}
    </section>
  )
}

function StudentDetailsDocument({ context, details, description }: {
  context: IppPreviewContext
  details?: StudentPlanDetails
  description: string
}) {
  const display = (value?: string | null) => value?.trim() || '—'
  const rows = [
    ['Student Name', context.studentName, 'ASN', context.studentAsn],
    ['Student Grade', details?.gradeAtPlan ?? context.grade, 'School', details?.schoolAtPlan ?? context.schoolName],
    ['School Year', details?.schoolYear ?? context.schoolYear, 'Course', details?.courseName ?? context.courseName],
    ['Teacher', details?.teacherAtPlan ?? context.teacherName, 'Principal', details?.principalAtPlan],
  ]

  return (
    <div className="ipp-module-document-body ipp-student-details-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <dl className="ipp-student-detail-rows">
        {rows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
          <div className="ipp-student-detail-row" key={leftLabel}>
            <dt>{leftLabel}</dt><dd>{display(leftValue)}</dd>
            <dt>{rightLabel}</dt><dd>{display(rightValue)}</dd>
          </div>
        ))}
      </dl>
      <section className="ipp-attendance" aria-labelledby="ipp-attendance-title">
        <h4 id="ipp-attendance-title">Attendance</h4>
        <div className="ipp-attendance-grid">
          <div><span>Fall</span><strong>{formatAttendance(details?.fallAttendance)}</strong></div>
          <div><span>Winter</span><strong>{formatAttendance(details?.winterAttendance)}</strong></div>
          <div><span>Spring</span><strong>{formatAttendance(details?.springAttendance)}</strong></div>
        </div>
      </section>
      <footer className="ipp-module-last-updated">Last Updated: {formatPlanDate(details?.modifiedOn)}</footer>
    </div>
  )
}

const screenerRows = [
  { assessmentType: 'TOSREC', label: 'TOSREC', subscore: false, towre: false },
  { assessmentType: 'TOWRE', label: 'TOWRE', subscore: false, towre: true },
  { assessmentType: 'TOWRE RW', label: 'Real Word (RW)', subscore: true, towre: true },
  { assessmentType: 'TOWRE NW', label: 'Non Word (NW)', subscore: true, towre: true },
  { assessmentType: 'WRAT-5', label: 'WRAT-5', subscore: false, towre: false },
] as const

const screenerPeriods = ['Fall', 'Winter', 'Spring'] as const

function ScreenerResultsDocument({ description, response, loading, error }: {
  description: string
  response: StudentPlanScreenersResponse | null
  loading: boolean
  error: string | null
}) {
  return (
    <div className="ipp-module-document-body ipp-screener-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <p className="ipp-screener-legend">Standard score · descriptive term · assessment date</p>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading screener results…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : (
        <div className="ipp-screener-table-wrap">
          <table className="ipp-screener-table">
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                {screenerPeriods.map((period) => <th scope="col" key={period}>{period}</th>)}
              </tr>
            </thead>
            <tbody>
              {screenerRows.map((row) => (
                <tr className={row.towre ? 'towre-row' : undefined} key={row.assessmentType}>
                  <th className={row.subscore ? 'subscore' : undefined} scope="row">{row.label}</th>
                  {screenerPeriods.map((period) => {
                    const result = response?.results.find((item) => item.assessmentType === row.assessmentType && item.period === period)
                    const accent = result?.descriptiveTermFill || '#6c8292'
                    return (
                      <td key={period}>
                        {result?.standardScore !== null && result?.standardScore !== undefined ? (
                          <>
                            <div
                              className="ipp-screener-result"
                              style={{ borderColor: accent, backgroundColor: accent, color: result.descriptiveTermFont || '#12243d' }}
                            >
                              <strong>{result.standardScore}</strong>
                              {result.descriptiveTerm ? <span>{result.descriptiveTerm}</span> : null}
                            </div>
                            <small>{formatPlanDate(result.assessmentDate)}</small>
                          </>
                        ) : <span className="ipp-screener-empty">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SignaturesDocument({ description, details }: {
  description: string
  details?: StudentPlanDetails
}) {
  const signerRows = [
    { role: 'Parent or Guardian', name: details?.parentOrGuardianName },
    { role: 'Principal', name: details?.principalAtPlan },
  ]

  return (
    <div className="ipp-module-document-body ipp-signature-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <section className="ipp-parent-comment" aria-labelledby="ipp-parent-comment-title">
        <h4 id="ipp-parent-comment-title">Parent or Guardian Comments</h4>
        <div aria-label="Parent or guardian comments will appear here after signing" />
      </section>
      <div className="ipp-signer-rows">
        {signerRows.map((signer) => (
          <section className="ipp-signer-row" key={signer.role}>
            <p><span>{signer.role}: </span>{signer.name?.trim() || '—'}</p>
            <div className="ipp-signature-lines">
              <div><span>{signer.role} Signature</span></div>
              <div><span>Date Signed</span></div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function InterventionFocusDocument({ description, response, loading, error }: {
  description: string
  response: StudentPlanInterventionsResponse | null
  loading: boolean
  error: string | null
}) {
  return (
    <div className="ipp-module-document-body ipp-intervention-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading interventions…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : !response || response.interventions.length === 0 ? (
        <div className="ipp-intervention-empty">No interventions have been recorded for this school year.</div>
      ) : (
        <div className="ipp-intervention-table-wrap">
          <table className="ipp-intervention-table">
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Intervention Type</th>
                <th scope="col">Interventionist</th>
                <th scope="col">Date Started</th>
                <th scope="col">Date Withdrawn</th>
                <th scope="col">Withdrawn Reason</th>
              </tr>
            </thead>
            {response.interventions.map((intervention) => (
              <InterventionTableRows intervention={intervention} key={intervention.id} />
            ))}
          </table>
        </div>
      )}
    </div>
  )
}

function InterventionTableRows({ intervention }: { intervention: StudentPlanIntervention }) {
  const interventionist = intervention.interventionist?.trim() || intervention.teacher?.trim() || '—'
  const teacher = intervention.teacher?.trim()
  const metadata = [
    ['School', intervention.school],
    ['Grade', intervention.grade],
    ['Curriculum', intervention.curriculum],
    ['Teacher', teacher && teacher.toLocaleLowerCase() !== interventionist.toLocaleLowerCase() ? teacher : null],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
  const reason = intervention.withdrawnReason?.trim()
  const reasonClass = reason?.toLocaleLowerCase() === 'complete' || reason?.toLocaleLowerCase() === 'completed'
    ? ' completed'
    : reason?.toLocaleLowerCase() === 'incomplete' ? ' incomplete' : ''

  return (
    <tbody className="ipp-intervention-entry">
      <tr>
        <th scope="row">{intervention.interventionType}</th>
        <td>{interventionist}</td>
        <td className="date">{formatPlanDate(intervention.dateStarted)}</td>
        <td className="date">{formatPlanDate(intervention.dateWithdrawn)}</td>
        <td>{reason ? <span className={`ipp-withdrawal-reason${reasonClass}`}>{reason}</span> : <span className="ipp-intervention-dash">—</span>}</td>
      </tr>
      {metadata.length > 0 ? (
        <tr className="ipp-intervention-metadata">
          <td colSpan={5}>
            {metadata.map(([label, value]) => <span key={label}><strong>{label}:</strong> {value}</span>)}
          </td>
        </tr>
      ) : null}
      {intervention.additionalInformation?.trim() ? (
        <tr className="ipp-intervention-notes">
          <td colSpan={5}>
            <strong>Additional Information</strong>
            <p>{intervention.additionalInformation}</p>
          </td>
        </tr>
      ) : null}
    </tbody>
  )
}
