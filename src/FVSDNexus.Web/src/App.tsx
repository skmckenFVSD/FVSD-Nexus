import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  BookOpenText,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Database,
  FileCheck2,
  GraduationCap,
  Home,
  LifeBuoy,
  LogIn,
  School,
  ShieldEllipsis,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ExecutiveDashboard } from './ExecutiveDashboard'
import { AssessmentWorkspace } from './AssessmentWorkspace'
import { IppPreview } from './IppPreview'
import fvsdNexusLogo from './assets/fvsd-nexus-logo.png'

type User = {
  name: string
  email?: string
  isDeveloper: boolean
  activeDevelopmentRole: string | null
  availableDevelopmentRoles: string[]
  rlsIdentity: string
  rlsEvaluation: string
  currentSchoolYear: string
}

type RoleChangeResponse = {
  activeDevelopmentRole: string
  rlsIdentity: string
  rlsEvaluation: string
}

type ConnectionStatus = {
  status: string
  workspace: string
  semanticModel: string
  checkedAtUtc: string
}

type DataverseAccessContext = {
  roleRecordFound: boolean
  email: string
  storedRole: string
  effectiveRole: string
  pocEnabled: boolean
  continuumAdministrator: boolean
  primarySchool: { id: string; name: string } | null
  alternativeSchool: { id: string; name: string } | null
}

type FilterOptions = {
  schools: string[]
  schoolYears: string[]
  assessmentGroups: string[]
  curricula: string[]
  grades: string[]
  periods: string[]
}

type FilterState = {
  school: string[]
  schoolYear: string[]
  grade: string[]
  period: string[]
}

const emptyFilterOptions: FilterOptions = {
  schools: [],
  schoolYears: [],
  assessmentGroups: [],
  curricula: [],
  grades: [],
  periods: [],
}

const initialFilters: FilterState = {
  school: [],
  schoolYear: [],
  grade: [],
  period: [],
}

type ActivePage = 'executive' | 'assessments' | 'ipp-preview' | 'settings'
type StudentDisplayMode = 'real' | 'obfuscated'

type SidebarNavItem = {
  id: ActivePage | 'coming-soon'
  label: string
  icon: LucideIcon
  isComingSoon?: boolean
}

type SidebarNavGroup = {
  id: string
  label: string
  icon: LucideIcon
  items: SidebarNavItem[]
  emptyMessage?: string
}

const commonAnalyticsItems: SidebarNavItem[] = [
  { id: 'executive', label: 'Overview', icon: Home },
  { id: 'coming-soon', label: 'Literacy', icon: BookOpenText, isComingSoon: true },
  { id: 'coming-soon', label: 'Numeracy', icon: ChartNoAxesCombined, isComingSoon: true },
  { id: 'coming-soon', label: 'Wellness', icon: LifeBuoy, isComingSoon: true },
  { id: 'coming-soon', label: 'Interventions', icon: Activity, isComingSoon: true },
  { id: 'coming-soon', label: 'Attendance', icon: CalendarDays, isComingSoon: true },
]

function getNavGroups(role: string | null | undefined): SidebarNavGroup[] {
  const executiveRole = role === 'Executive'
  const dataAnalystRole = role === 'Data Analyst (Administrator)'
  const analyticsItems = executiveRole
    ? commonAnalyticsItems
    : [
        ...commonAnalyticsItems,
        { id: 'coming-soon', label: 'Student Progression', icon: GraduationCap, isComingSoon: true } as SidebarNavItem,
        { id: 'coming-soon', label: 'Submission Tracking', icon: FileCheck2, isComingSoon: true } as SidebarNavItem,
      ]

  return [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      items: analyticsItems,
    },
    {
      id: 'school-administration',
      label: 'School Administration',
      icon: School,
      items: [
        { id: 'assessments', label: 'Class Assignments', icon: BookOpenText },
        { id: 'coming-soon', label: 'Assessments', icon: FileCheck2, isComingSoon: true },
        { id: 'coming-soon', label: 'Interventions', icon: LifeBuoy, isComingSoon: true },
        { id: 'ipp-preview', label: 'Individual Program Plans', icon: GraduationCap },
      ],
    },
    ...(dataAnalystRole ? [{
      id: 'governance',
      label: 'Governance',
      icon: ShieldEllipsis,
      items: [
        { id: 'coming-soon', label: 'Data Quality', icon: CircleCheck, isComingSoon: true },
        { id: 'coming-soon', label: 'Data Catalog', icon: Database, isComingSoon: true },
        { id: 'coming-soon', label: 'Data Administration', icon: Settings, isComingSoon: true },
      ],
    } satisfies SidebarNavGroup] : []),
  ]
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error(`${response.status}`)
  return response.json() as Promise<T>
}

export function App() {
  const [activePage, setActivePage] = useState<ActivePage>('executive')
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(emptyFilterOptions)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [filtersReady, setFiltersReady] = useState(false)
  const [roleChanging, setRoleChanging] = useState<string | null>(null)
  const [studentDisplayMode, setStudentDisplayMode] = useState<StudentDisplayMode>('real')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNavGroups, setExpandedNavGroups] = useState<Record<string, boolean>>({
    analytics: true,
    'school-administration': true,
    governance: false,
  })

  useEffect(() => {
    getJson<User>('/api/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getJson<ConnectionStatus>('/api/semantic-model/status'),
      getJson<FilterOptions>('/api/filters'),
    ])
      .then(([connection, options]) => {
        setConnectionStatus(connection)
        const orderedOptions = {
          ...options,
          schoolYears: [...options.schoolYears].sort((left, right) => right.localeCompare(left, undefined, { numeric: true })),
          schools: [...options.schools].sort((left, right) => left.localeCompare(right)),
        }
        setFilterOptions(orderedOptions)
        setFilters((current) => ({
          ...current,
          schoolYear: current.schoolYear.length > 0
            ? current.schoolYear.filter((year) => orderedOptions.schoolYears.includes(year))
            : orderedOptions.schoolYears.slice(0, 1),
        }))
        setFiltersReady(true)
      })
      .catch(() => {
        setConnectionStatus(null)
        setError('The semantic model could not be queried with this account. Confirm Read and Build access to FVSDAnalytics.')
      })
  }, [user])

  const updateMultiFilter = (name: 'schoolYear' | 'period' | 'school' | 'grade', value: string[]) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const changeDevelopmentRole = async (role: string) => {
    if (!user?.isDeveloper || role === user.activeDevelopmentRole) return

    setRoleChanging(role)
    setFiltersReady(false)
    setError(null)
    try {
      const response = await fetch('/api/development/role', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-FVSD-Development-Request': 'role-switcher',
        },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) throw new Error(`${response.status}`)

      const update = await response.json() as RoleChangeResponse
      setUser((current) => current ? {
        ...current,
        activeDevelopmentRole: update.activeDevelopmentRole,
        rlsIdentity: update.rlsIdentity,
        rlsEvaluation: update.rlsEvaluation,
      } : current)
      setFilters(initialFilters)
    } catch {
      setFiltersReady(true)
      setError('The development role could not be changed. Your real Fabric identity and access were not altered.')
    } finally {
      setRoleChanging(null)
    }
  }

  const canSelectSchool = user?.activeDevelopmentRole === 'Executive'
    || user?.activeDevelopmentRole === 'Data Analyst (Administrator)'
  const navGroups = getNavGroups(user?.activeDevelopmentRole)

  useEffect(() => {
    if (!canSelectSchool && filters.school.length > 0) {
      setFilters((current) => ({ ...current, school: [] }))
    }
  }, [canSelectSchool, filters.school.length])

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-is-collapsed' : 'app-shell'}>
      <aside className={sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark"><img src={fvsdNexusLogo} alt="" /></div>
          <div className="brand-details">
            <div className="brand-copy">
              <strong>FVSD Nexus</strong>
              <span className="brand-division">Fort Vermilion School Division</span>
              <span className="brand-tagline">From Insights To Action</span>
            </div>
            <button
              className="sidebar-collapse-toggle"
              type="button"
              aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>

        <nav aria-label="Main navigation">
          {navGroups.map(({ id, label, icon: GroupIcon, items, emptyMessage }) => {
            const isExpanded = expandedNavGroups[id] ?? false
            const containsActivePage = items.some((item) => item.id === activePage)
            const panelId = `navigation-group-${id}`

            return (
              <div className="nav-group" key={id}>
                <button
                  className={containsActivePage ? 'nav-group-toggle has-active-item' : 'nav-group-toggle'}
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  title={sidebarCollapsed ? label : undefined}
                  onClick={() => setExpandedNavGroups((current) => ({ ...current, [id]: !isExpanded }))}
                >
                  <GroupIcon className="nav-group-icon" size={16} aria-hidden="true" />
                  <span className="nav-group-label">{label}</span>
                  <ChevronDown
                    className={isExpanded ? 'nav-group-chevron expanded' : 'nav-group-chevron'}
                    size={15}
                    aria-hidden="true"
                  />
                </button>
                {isExpanded ? (
                  <div className="nav-group-items" id={panelId}>
                    {items.map(({ id: itemId, label: itemLabel, icon: Icon, isComingSoon }) => {
                      const isActive = itemId === activePage
                      return (
                      <button
                        className={isActive ? 'nav-item active' : 'nav-item'}
                        key={itemLabel}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        title={sidebarCollapsed ? itemLabel : undefined}
                        disabled={itemId === 'coming-soon'}
                        onClick={() => {
                          if (itemId !== 'coming-soon') setActivePage(itemId)
                        }}
                      >
                        <Icon size={17} aria-hidden="true" />
                        <span>{itemLabel}</span>
                        {isComingSoon ? <span className="soon">Soon</span> : null}
                      </button>
                      )
                    })}
                    {items.length === 0 && emptyMessage ? <span className="nav-group-empty">{emptyMessage}</span> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <button
          className={activePage === 'settings' ? 'sidebar-settings active' : 'sidebar-settings'}
          type="button"
          aria-current={activePage === 'settings' ? 'page' : undefined}
          title="Settings"
          onClick={() => setActivePage('settings')}
        >
          <Settings size={17} aria-hidden="true" />
          <span>Settings</span>
        </button>

        <div className="sidebar-footer">
          {user ? user.isDeveloper ? (
            <DevelopmentRoleSwitcher
              roles={user.availableDevelopmentRoles}
              value={user.activeDevelopmentRole}
              changing={roleChanging}
              onChange={changeDevelopmentRole}
              studentDisplayMode={studentDisplayMode}
              onStudentDisplayModeChange={setStudentDisplayMode}
            />
          ) : <CurrentRoleCard role={user.activeDevelopmentRole} /> : null}
          {user ? (
            <div className="user-card">
              <div><strong>{user.name}</strong><span>{user.email}</span></div>
              <div className="security-label"><ShieldCheck size={14} /> Secured by FVSD Entra ID</div>
            </div>
          ) : null}
        </div>
      </aside>

      <main className={activePage === 'assessments' ? 'assessment-page' : activePage === 'ipp-preview' ? 'ipp-page' : undefined}>
        <header className="page-header">
          <div>
            {activePage !== 'executive' ? <span className="eyebrow">{activePage === 'assessments'
                ? 'Assessment data entry - proof of concept'
                : activePage === 'ipp-preview'
                  ? 'Individual Program Plans - design preview'
                  : 'Account and system configuration'}</span> : null}
            <h1>{activePage === 'executive'
              ? 'Analytics Overview'
              : activePage === 'assessments'
                ? 'Class Assignment'
                : activePage === 'ipp-preview'
                  ? 'Foundations 1 IPP'
                  : 'Settings'}</h1>
            <p className={activePage === 'executive' ? 'page-header-description accent' : 'page-header-description'}>{activePage === 'executive'
              ? 'Move from district-level achievement signals to the schools and periods that need attention.'
              : activePage === 'assessments'
                ? 'Find a teacher section, load its assigned students, and prepare for governed assessment entry.'
                : activePage === 'ipp-preview'
                  ? 'Preview how a selected student plan could be reviewed, printed, and later opened from Class Assignment.'
                  : 'Review your identity, role, assignments, licensing policy, and governed data connections.'}</p>
          </div>
          {user ? (
            <div className="header-actions">
              {user.isDeveloper ? (
                <div className="development-context">
                  <strong>Simulated: {formatRoleLabel(user.activeDevelopmentRole ?? 'FVSD user')}</strong>
                  <span>Fabric RLS: {user.rlsIdentity}</span>
                </div>
              ) : null}
              <a className="outline-button" href="/api/auth/signout">Sign out</a>
            </div>
          ) : null}
        </header>

        {!authChecked ? <div className="loading-panel">Checking your FVSD sign-in…</div> : !user ? (
          <section className="sign-in-panel">
            <div className="sign-in-icon"><ShieldCheck size={30} /></div>
            <span className="eyebrow">Private FVSD analytics</span>
            <h2>Use your FVSD account to continue</h2>
            <p>Your signed-in identity is passed to the Fabric semantic model so its permissions and row-level security remain authoritative.</p>
            <a className="primary-button" href="/api/auth/signin"><LogIn size={18} /> Sign in with Microsoft</a>
          </section>
        ) : (
          activePage === 'executive' ? <>
            <section className="filter-panel">
              <div className="filter-panel-heading">
                <div className="filter-title"><Activity size={17} /><strong>Analysis context</strong></div>
              </div>
              <div className={canSelectSchool ? 'filter-row persistent-filter-row' : 'filter-row persistent-filter-row without-school'}>
                <MultiSelectFilter
                  label="School year"
                  value={filters.schoolYear}
                  options={filterOptions.schoolYears}
                  allLabel="All school years"
                  onChange={(value) => updateMultiFilter('schoolYear', value)}
                />
                <MultiSelectFilter
                  label="Period"
                  value={filters.period}
                  options={filterOptions.periods}
                  allLabel="All periods"
                  onChange={(value) => updateMultiFilter('period', value)}
                />
                {canSelectSchool ? (
                  <MultiSelectFilter
                    label="School"
                    value={filters.school}
                    options={filterOptions.schools}
                    allLabel="All permitted schools"
                    onChange={(value) => updateMultiFilter('school', value)}
                  />
                ) : null}
              </div>
              <div className="filter-panel-heading secondary-heading"><span>Executive Dashboard filters</span></div>
              <div className="filter-row page-filter-row single-page-filter">
                <MultiSelectFilter
                  label="Grade"
                  value={filters.grade}
                  options={filterOptions.grades}
                  allLabel="All grades"
                  onChange={(value) => updateMultiFilter('grade', value)}
                />
              </div>
              <div className="selection">Live selection: {describeFilters(filters)}</div>
            </section>

            {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}
            {filtersReady
              ? <ExecutiveDashboard filters={filters} />
              : <div className="loading-panel">Loading governed filters…</div>}
          </> : activePage === 'assessments' ? (
            <AssessmentWorkspace
              currentSchoolYear={user.currentSchoolYear}
              studentDisplayMode={studentDisplayMode}
              key={user.activeDevelopmentRole ?? 'assessment-workspace'}
            />
          ) : activePage === 'ipp-preview' ? (
            <IppPreview
              onBackToClassAssignment={() => {
                setActivePage('assessments')
                setExpandedNavGroups((current) => ({ ...current, 'school-administration': true }))
              }}
            />
          ) : (
            <SettingsPage user={user} connection={connectionStatus} />
          )
        )}
      </main>
    </div>
  )
}

function MultiSelectFilter({ label, value, options, allLabel, onChange }: {
  label: string
  value: string[]
  options: string[]
  allLabel: string
  onChange: (value: string[]) => void
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const selected = new Set(value)
  const summary = value.length === 0
    ? allLabel
    : value.length === 1
      ? value[0]
      : value.length === options.length
        ? `All ${options.length} selected`
        : `${value.length} selected`

  const toggle = (option: string, checked: boolean) => {
    const next = new Set(value)
    if (checked) next.add(option)
    else next.delete(option)
    onChange(options.filter((item) => next.has(item)))
  }

  useEffect(() => {
    const closeWhenClickingOutside = (event: PointerEvent) => {
      const details = detailsRef.current
      if (details?.open && !event.composedPath().includes(details)) {
        details.open = false
      }
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      const details = detailsRef.current
      if (event.key === 'Escape' && details?.open) {
        details.open = false
        details.querySelector('summary')?.focus()
      }
    }

    document.addEventListener('pointerdown', closeWhenClickingOutside)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [])

  return (
    <div className="filter multi-select-filter">
      <span>{label}</span>
      <details ref={detailsRef}>
        <summary>{summary}</summary>
        <div className="multi-select-menu">
          <div className="multi-select-actions">
            <button type="button" onClick={() => onChange([...options])} disabled={options.length === 0}>Select all</button>
            <button type="button" onClick={() => onChange([])} disabled={value.length === 0}>Clear</button>
          </div>
          <div className="multi-select-options">
            {options.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={selected.has(option)}
                  onChange={(event) => toggle(option, event.target.checked)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}

function DevelopmentRoleSwitcher({
  roles,
  value,
  changing,
  onChange,
  studentDisplayMode,
  onStudentDisplayModeChange,
}: {
  roles: string[]
  value: string | null
  changing: string | null
  onChange: (role: string) => void
  studentDisplayMode: StudentDisplayMode
  onStudentDisplayModeChange: (mode: StudentDisplayMode) => void
}) {
  return (
    <section className="development-role-card" aria-label="Development role switcher">
      <label htmlFor="development-role">Current role</label>
      <select
        id="development-role"
        value={value ?? ''}
        disabled={changing !== null}
        onChange={(event) => onChange(event.target.value)}
      >
        {roles.map((role) => <option value={role} key={role}>{formatRoleLabel(role)}</option>)}
      </select>
      <div className="development-display-mode">
        <span>Student data</span>
        <div className="development-display-toggle" role="group" aria-label="Student data display mode">
          <button
            type="button"
            className={studentDisplayMode === 'real' ? 'active' : ''}
            aria-pressed={studentDisplayMode === 'real'}
            aria-label="Show real student names and ASNs"
            title="Real student names and ASNs"
            onClick={() => onStudentDisplayModeChange('real')}
          >
            R
          </button>
          <button
            type="button"
            className={studentDisplayMode === 'obfuscated' ? 'active' : ''}
            aria-pressed={studentDisplayMode === 'obfuscated'}
            aria-label="Show obfuscated student names and ASNs"
            title="Obfuscated student names and ASNs"
            onClick={() => onStudentDisplayModeChange('obfuscated')}
          >
            O
          </button>
        </div>
      </div>
      <small>{changing ? 'Switching role…' : 'Development simulation only. Fabric RLS still uses your signed-in identity.'}</small>
    </section>
  )
}

function CurrentRoleCard({ role }: { role: string | null }) {
  return (
    <section className="current-role-card" aria-label="Current role">
      <span>Current role</span>
      <strong>{formatRoleLabel(role ?? 'FVSD user')}</strong>
    </section>
  )
}

function SettingsPage({ user, connection }: { user: User; connection: ConnectionStatus | null }) {
  const [dataverse, setDataverse] = useState<DataverseAccessContext | null>(null)
  const [dataverseError, setDataverseError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDataverseError(false)
    getJson<DataverseAccessContext>('/api/dataverse/access-context')
      .then((context) => {
        if (!cancelled) setDataverse(context)
      })
      .catch(() => {
        if (!cancelled) setDataverseError(true)
      })
    return () => { cancelled = true }
  }, [user.activeDevelopmentRole])

  const fabricConnected = connection?.status.toLowerCase() === 'connected'
  const dataverseConnected = Boolean(dataverse?.roleRecordFound)

  return (
    <section className="settings-page" aria-label="Settings">
      <div className="settings-grid">
        <article className="settings-card settings-connections">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><Database size={19} aria-hidden="true" /></div>
            <div><span>Connections</span><h2>Governed data sources</h2></div>
          </div>
          <div className="connection-list">
            <div className="connection-row">
              <div><strong>Microsoft Fabric</strong><span>{connection?.semanticModel ?? 'FVSDAnalytics'} · {connection?.workspace ?? 'Assessment Screening'}</span></div>
              <ConnectionBadge connected={fabricConnected} label={connection?.status ?? 'Checking'} />
            </div>
            <div className="connection-row">
              <div><strong>Microsoft Dataverse</strong><span>FVSD operational truth store · delegated user access</span></div>
              <ConnectionBadge connected={dataverseConnected} label={dataverseError ? 'Unavailable' : dataverse ? 'Connected' : 'Checking'} />
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><ShieldCheck size={19} aria-hidden="true" /></div>
            <div><span>Identity and access</span><h2>Assignment and role</h2></div>
          </div>
          <dl className="settings-detail-list">
            <div><dt>Signed-in account</dt><dd>{user.email ?? user.name}</dd></div>
            <div><dt>Current role</dt><dd>{formatRoleLabel(user.activeDevelopmentRole ?? dataverse?.effectiveRole ?? 'FVSD user')}</dd></div>
            <div><dt>Primary assignment</dt><dd>{dataverse?.primarySchool?.name ?? 'Not assigned'}</dd></div>
            <div><dt>Alternative assignment</dt><dd>{dataverse?.alternativeSchool?.name ?? 'Not assigned'}</dd></div>
          </dl>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><FileCheck2 size={19} aria-hidden="true" /></div>
            <div><span>Licence details</span><h2>Named-user policy</h2></div>
          </div>
          <dl className="settings-detail-list">
            <div><dt>Authentication</dt><dd>FVSD Entra ID</dd></div>
            <div><dt>Application access</dt><dd>Named user</dd></div>
            <div><dt>Power Apps model</dt><dd>Pay-as-you-go</dd></div>
            <div><dt>PoC enabled</dt><dd>{dataverse ? (dataverse.pocEnabled ? 'Yes' : 'No') : 'Checking'}</dd></div>
          </dl>
        </article>

        <article className="settings-card settings-request-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><CircleAlert size={19} aria-hidden="true" /></div>
            <div><span>Access support</span><h2>Request a change</h2></div>
          </div>
          <p>Role, school assignment, and licence changes will follow a governed approval workflow from this page.</p>
          <button type="button" disabled>Request changes <span>Planned</span></button>
        </article>
      </div>
    </section>
  )
}

function ConnectionBadge({ connected, label }: { connected: boolean; label: string }) {
  return (
    <span className={connected ? 'connection-badge connected' : 'connection-badge'}>
      {connected ? <CircleCheck size={13} aria-hidden="true" /> : null}{label}
    </span>
  )
}

function formatRoleLabel(role: string) {
  return role === 'Class Room Support' ? 'Classroom Support' : role
}

function describeFilters(filters: FilterState) {
  const selected = [
    describeMultiSelection('Year', filters.schoolYear),
    describeMultiSelection('Period', filters.period),
    describeMultiSelection('School', filters.school),
    describeMultiSelection('Grade', filters.grade),
  ].filter((value): value is string => value !== null)
  return selected.length ? selected.join(' / ') : 'all permitted assessment data'
}

function describeMultiSelection(label: string, values: string[]) {
  if (values.length === 0) return null
  return values.length === 1 ? `${label}: ${values[0]}` : `${label}: ${values.length} selected`
}
