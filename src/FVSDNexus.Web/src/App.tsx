import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  BookOpenText,
  Bot,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Database,
  FileText,
  GraduationCap,
  Home,
  LifeBuoy,
  LogIn,
  School,
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

type ActivePage = 'executive' | 'assessments' | 'ipp-preview'

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

const navGroups: SidebarNavGroup[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Activity,
    items: [
      { id: 'executive', label: 'Executive overview', icon: Home },
      { id: 'coming-soon', label: 'School profile', icon: School, isComingSoon: true },
      { id: 'coming-soon', label: 'Student success', icon: GraduationCap, isComingSoon: true },
      { id: 'coming-soon', label: 'Attendance', icon: CalendarDays, isComingSoon: true },
      { id: 'coming-soon', label: 'Literacy', icon: BookOpenText, isComingSoon: true },
      { id: 'coming-soon', label: 'Intervention tracking', icon: LifeBuoy, isComingSoon: true },
      { id: 'coming-soon', label: 'Analytics assistant', icon: Bot, isComingSoon: true },
    ],
  },
  {
    id: 'assessments',
    label: 'Assessments',
    icon: BookOpenText,
    items: [
      { id: 'assessments', label: 'Class Assignment', icon: BookOpenText },
    ],
  },
  {
    id: 'individual-program-plans',
    label: 'Individual Program Plans',
    icon: GraduationCap,
    items: [
      { id: 'ipp-preview', label: 'Foundations 1 preview', icon: FileText },
    ],
  },
  {
    id: 'interventions',
    label: 'Interventions',
    icon: LifeBuoy,
    items: [],
    emptyMessage: 'Capability pages will be added here.',
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    items: [
      { id: 'coming-soon', label: 'Settings', icon: Settings, isComingSoon: true },
    ],
  },
]

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
  const [error, setError] = useState<string | null>(null)
  const [expandedNavGroups, setExpandedNavGroups] = useState<Record<string, boolean>>({
    analytics: true,
    assessments: true,
    'individual-program-plans': false,
    interventions: false,
    administration: true,
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

  useEffect(() => {
    if (!canSelectSchool && filters.school.length > 0) {
      setFilters((current) => ({ ...current, school: [] }))
    }
  }, [canSelectSchool, filters.school.length])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src={fvsdNexusLogo} alt="" /></div>
          <div className="brand-copy">
            <strong>FVSD Nexus</strong>
            <span className="brand-division">Fort Vermilion School Division</span>
            <span className="brand-tagline">From Insights To Action</span>
          </div>
        </div>

        <nav aria-label="Main navigation">
          {navGroups.map(({ id, label, icon: GroupIcon, items, emptyMessage }) => {
            const isExpanded = expandedNavGroups[id] ?? false
            const panelId = `navigation-group-${id}`

            return (
              <div className="nav-group" key={id}>
                <button
                  className="nav-group-toggle"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
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

        {user ? (
          <DataSourceContextCard
            connection={connectionStatus}
            filters={filters}
            filterOptions={filterOptions}
            role={user.activeDevelopmentRole}
          />
        ) : null}

        <div className="sidebar-footer">
          {user ? user.isDeveloper ? (
            <DevelopmentRoleSwitcher
              roles={user.availableDevelopmentRoles}
              value={user.activeDevelopmentRole}
              changing={roleChanging}
              onChange={changeDevelopmentRole}
            />
          ) : <CurrentRoleCard role={user.activeDevelopmentRole} /> : null}
          <div className="security-label"><ShieldCheck size={15} /> Secured by FVSD Entra ID</div>
          {user ? <div className="user-card"><div><strong>{user.name}</strong><span>{user.email}</span></div></div> : null}
        </div>
      </aside>

      <main className={activePage === 'assessments' ? 'assessment-page' : activePage === 'ipp-preview' ? 'ipp-page' : undefined}>
        <header className="page-header">
          <div>
            <span className="eyebrow">{activePage === 'executive'
              ? (user?.activeDevelopmentRole ? `${user.activeDevelopmentRole} development view` : 'FVSD leadership')
              : activePage === 'assessments'
                ? 'Assessment data entry - proof of concept'
                : 'Individual Program Plans - design preview'}</span>
            <h1>{activePage === 'executive'
              ? 'Executive Dashboard'
              : activePage === 'assessments'
                ? 'Class Assignment'
                : 'Foundations 1 IPP'}</h1>
            <p>{activePage === 'executive'
              ? 'Move from district-level achievement signals to the schools and periods that need attention.'
              : activePage === 'assessments'
                ? 'Find a teacher section, load its assigned students, and prepare for governed assessment entry.'
                : 'Preview how a selected student plan could be reviewed, printed, and later opened from Class Assignment.'}</p>
          </div>
          {user ? (
            <div className="header-actions">
              {user.isDeveloper ? (
                <div className="development-context">
                  <strong>Simulated: {user.activeDevelopmentRole}</strong>
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
              key={user.activeDevelopmentRole ?? 'assessment-workspace'}
            />
          ) : (
            <IppPreview
              onBackToClassAssignment={() => {
                setActivePage('assessments')
                setExpandedNavGroups((current) => ({ ...current, assessments: true }))
              }}
            />
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

function DevelopmentRoleSwitcher({ roles, value, changing, onChange }: {
  roles: string[]
  value: string | null
  changing: string | null
  onChange: (role: string) => void
}) {
  return (
    <section className="development-role-card" aria-label="Development role switcher">
      <span>Current role</span>
      <div className="development-role-options">
        {roles.map((role) => (
          <button
            type="button"
            className={role === value ? 'active' : ''}
            aria-pressed={role === value}
            disabled={changing !== null}
            onClick={() => onChange(role)}
            key={role}
          >
            {changing === role ? 'Switching…' : role}
          </button>
        ))}
      </div>
      <small>Development simulation only. Fabric RLS still uses your signed-in identity.</small>
    </section>
  )
}

function DataSourceContextCard({ connection, filters, filterOptions, role }: {
  connection: ConnectionStatus | null
  filters: FilterState
  filterOptions: FilterOptions
  role: string | null
}) {
  const isConnected = connection?.status.toLowerCase() === 'connected'

  return (
    <section className="sidebar-data-source" aria-label="Data source and current analysis context">
      <div className="sidebar-data-source-heading">
        <Database size={17} aria-hidden="true" />
        <div>
          <span>Data source</span>
          <strong>{connection?.semanticModel ?? 'FVSDAnalytics'}</strong>
        </div>
      </div>
      <dl>
        <div><dt>Workspace</dt><dd>{connection?.workspace ?? 'Assessment Screening'}</dd></div>
        <div><dt>Access</dt><dd>Delegated user</dd></div>
        <div>
          <dt>Status</dt>
          <dd className={isConnected ? 'connected' : undefined}>
            {isConnected ? <CircleCheck size={11} aria-hidden="true" /> : null}
            {connection?.status ?? 'Checking…'}
          </dd>
        </div>
      </dl>
      <div className="sidebar-data-source-context">
        <span>Current context</span>
        <dl>
          <div><dt>Schools</dt><dd>{filters.school.length || filterOptions.schools.length} {filters.school.length > 0 ? 'selected' : 'visible'}</dd></div>
          <div><dt>Year</dt><dd>{describeSidebarSelection(filters.schoolYear, 'All years')}</dd></div>
          <div><dt>Grades</dt><dd>{describeSidebarSelection(filters.grade, 'All grades')}</dd></div>
          <div><dt>Role</dt><dd>{role ?? 'FVSD user'}</dd></div>
        </dl>
      </div>
    </section>
  )
}

function CurrentRoleCard({ role }: { role: string | null }) {
  return (
    <section className="current-role-card" aria-label="Current role">
      <span>Current role</span>
      <strong>{role ?? 'FVSD user'}</strong>
    </section>
  )
}

function describeSidebarSelection(values: string[], allLabel: string) {
  if (values.length === 0) return allLabel
  return values.length === 1 ? values[0] : `${values.length} selected`
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
