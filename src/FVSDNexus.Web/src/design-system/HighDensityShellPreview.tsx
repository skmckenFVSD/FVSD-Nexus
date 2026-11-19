import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ClassAssignmentWorkspaceV2 } from '../ClassAssignmentWorkspaceV2'
import { StudentScreenersDashboard } from '../StudentScreenersDashboard'
import { StudentProgramPlansDashboard } from '../StudentProgramPlansDashboard'
import { IppPreview, type IppPreviewContext } from '../IppPreview'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  Home,
  Eye,
  Files,
  FileText,
  FileX2,
  LockKeyhole,
  LogIn,
  Mail,
  Menu,
  NotebookPen,
  PanelsTopLeft,
  Pencil,
  Plus,
  RotateCcw,
  RefreshCw,
  Save,
  School,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Dialog } from '../components/ui'
import nexusLogo from '../assets/fvsd-nexus.svg'
import '../styles/high-density-shell.css'

type NavigationItem = { id: string; label: string; icon: LucideIcon; soon?: boolean }
type NavigationGroup = { id: string; label: string; icon: LucideIcon; items: NavigationItem[] }
type TeacherSection = { name: string; students: number }
type CourseSection = { name: string; code: string; teachers: TeacherSection[] }
type SelectedClass = { course: CourseSection; teacher: TeacherSection }
type StudentRecord = { name: string; grade: string; asn: string; dateOfBirth: string; gender: string; sped: string }
type AssessmentHistoryPreview = { schoolYear: string; period: string; standardScore: number; descriptiveTerm: string; termLevel: number }
type AssessmentModalState = { mode: 'create' | 'view' | 'edit'; assessmentType: string } | null
type HistoryView = 'assessment' | 'program-plan'
type PlanRail = 'modules' | 'exports' | null
type AnalyticsFocus = 'Literacy' | 'Numeracy' | 'Wellbeing'
type StudentDisplayMode = 'real' | 'obfuscated'

type ShellUser = {
  name: string
  email?: string
  isDeveloper: boolean
  activeDevelopmentRole: string | null
  activeDevelopmentUserEmail: string | null
  availableDevelopmentRoles: string[]
  rlsIdentity: string
  rlsEvaluation: string
  currentSchoolYear: string
}

type ShellRoleChangeResponse = {
  activeDevelopmentRole: string
  rlsIdentity: string
  rlsEvaluation: string
}

type ShellConnectionStatus = {
  status: string
  workspace: string
  semanticModel: string
  checkedAtUtc: string
}

type CopilotAccessStatus = {
  experience: 'Microsoft365Copilot' | 'CopilotChat'
  hasMicrosoft365Copilot: boolean
  workIqAvailable: boolean
  workIqStatus: string
  workBasedBillingPolicyStatus: string
  workBasedBillingStatus: string
  licenseCheckStatus: string
  source: string
  message: string
  checkedAtUtc: string
}

type ShellAccessContext = {
  roleRecordFound: boolean
  email: string
  storedRole: string
  effectiveRole: string
  pocEnabled: boolean
  continuumAdministrator: boolean
  primarySchool: { id: string; name: string } | null
  alternativeSchool: { id: string; name: string } | null
}

const screenerTermScale = [
  { level: 1, label: 'Very Poor' },
  { level: 2, label: 'Poor' },
  { level: 3, label: 'Below Average' },
  { level: 4, label: 'Average' },
  { level: 5, label: 'Above Average' },
  { level: 6, label: 'Superior' },
  { level: 7, label: 'Very Superior' },
] as const

function getScreenerTerm(score: number) {
  if (score < 70) return screenerTermScale[0]
  if (score < 80) return screenerTermScale[1]
  if (score < 90) return screenerTermScale[2]
  if (score < 110) return screenerTermScale[3]
  if (score < 120) return screenerTermScale[4]
  if (score < 130) return screenerTermScale[5]
  return screenerTermScale[6]
}

const allNavigationGroups: NavigationGroup[] = [
  {
    id: 'administration',
    label: 'Administration',
    icon: School,
    items: [
      { id: 'class-assignments', label: 'Class Assignments', icon: UsersRound },
      { id: 'assessments', label: 'Student Screeners', icon: ClipboardCheck },
      { id: 'individual-plans', label: 'Student Program Plans', icon: GraduationCap },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Activity,
    items: [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'literacy', label: 'Literacy', icon: BookOpenText },
      { id: 'numeracy', label: 'Numeracy', icon: BarChart3 },
      { id: 'wellness', label: 'Wellness', icon: HeartPulse },
      { id: 'analytics-interventions', label: 'Interventions', icon: Target },
      { id: 'attendance', label: 'Attendance', icon: CalendarDays },
      { id: 'progression', label: 'Student Progression', icon: GraduationCap },
      { id: 'submissions', label: 'Submission Tracking', icon: FileCheck2 },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: Shield,
    items: [
      { id: 'data-quality', label: 'Data Quality', icon: ClipboardCheck },
      { id: 'data-catalog', label: 'OneLake Catalog', icon: Database },
      { id: 'data-administration', label: 'Data Administration', icon: Settings },
    ],
  },
]

function getNavigationGroups(role: string): NavigationGroup[] {
  return allNavigationGroups.filter((group) => group.id !== 'governance' || normalizeRoleName(role) === 'Data Administrator')
}

function normalizeRoleName(role: string) {
  if (role === 'Class Room Support') return 'Student Support'
  if (role === 'Data Analyst (Administrator)' || role === 'Data Analyst') return 'Data Administrator'
  if (role === 'Administrator') return 'School Administrator'
  return role
}

function formatRoleLabel(role: string) {
  return normalizeRoleName(role)
}

const roleScopeDefinitions = [
  {
    role: 'Executive',
    scope: 'All schools, sections, and students',
    source: 'Division-wide governed scope',
    state: 'active',
  },
  {
    role: 'School Administrator',
    scope: 'All data within assigned schools',
    source: 'User Role · Assignment One and Assignment Two',
    state: 'active',
  },
  {
    role: 'Teacher',
    scope: 'Own teacher sections and their students',
    source: 'Teacher Section · teacher system-user UPN',
    state: 'active',
  },
  {
    role: 'Student Support',
    scope: 'Assigned support sections and their students',
    source: 'Support Staff Sections table',
    state: 'planned',
  },
  {
    role: 'Specialist Support',
    scope: 'Students individually assigned to the specialist',
    source: 'Specialist-to-student assignment table',
    state: 'planned',
  },
  {
    role: 'Data Administrator',
    scope: 'Full Dataverse and Microsoft Fabric visibility',
    source: 'Data administration role and Fabric security',
    state: 'active',
  },
] as const

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FV'
}

async function getShellJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; reauthorizeUrl?: string } | null
    throw Object.assign(new Error(problem?.title ?? `${response.status}`), {
      status: response.status,
      reauthorizeUrl: problem?.reauthorizeUrl,
    })
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) throw new Error('AUTH_REQUIRED')
  return response.json() as Promise<T>
}

function getReauthorizeUrl(error: unknown) {
  if (!error || typeof error !== 'object' || !('reauthorizeUrl' in error)) return null
  const reauthorizeUrl = (error as { reauthorizeUrl?: unknown }).reauthorizeUrl
  return typeof reauthorizeUrl === 'string' && reauthorizeUrl.startsWith('/') ? reauthorizeUrl : null
}

const literacySections: CourseSection[] = [
  {
    name: 'English Language Arts and Literature',
    code: 'ELALIT',
    teachers: [
      { name: 'Anujan Kirubaharan', students: 33 },
      { name: 'Janelle Lizotte', students: 35 },
      { name: 'Nicole Aspeslet', students: 18 },
    ],
  },
  {
    name: 'English Language Arts and Literature 1',
    code: 'ELALIT1',
    teachers: [
      { name: 'Deanna Kearney', students: 17 },
      { name: 'Jodi Boisvert', students: 16 },
      { name: 'Laurie Dirsa', students: 16 },
      { name: 'Shelby Roberts', students: 17 },
    ],
  },
  {
    name: 'English Language Arts and Literature 2',
    code: 'ELALIT2',
    teachers: [
      { name: 'Jedrock Panes', students: 17 },
      { name: 'Wanda Pickrem', students: 17 },
    ],
  },
  {
    name: 'English Language Arts and Literature 3',
    code: 'ELALIT3',
    teachers: [
      { name: 'Sophia Gibson', students: 25 },
      { name: 'Stephanie Connors', students: 26 },
    ],
  },
]

const foundationsSections: CourseSection[] = [
  {
    name: 'Foundations',
    code: 'FNDATNS',
    teachers: [
      { name: 'Natalie Morris', students: 13 },
      { name: 'Courtney Petkus', students: 25 },
    ],
  },
]

const homeroomSections: CourseSection[] = [
  {
    name: 'Grade 5 Homeroom',
    code: 'HRM5',
    teachers: [
      { name: 'Natalie Morris', students: 25 },
      { name: 'Courtney Petkus', students: 24 },
    ],
  },
]

const studentRoster: StudentRecord[] = [
  { name: 'Student, Demo', grade: 'Grade 5', asn: '999999', dateOfBirth: 'Mar 12, 2017', gender: 'Female', sped: 'Coded' },
  { name: 'Acharya, Swastik', grade: 'Kindergarten', asn: '316519933', dateOfBirth: 'Jul 26, 2021', gender: 'Male', sped: 'Not Coded' },
  { name: 'Alook, Jayda Lorraine', grade: 'Kindergarten', asn: '317245132', dateOfBirth: 'Dec 04, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Amurao, Leo Andre Barallas', grade: 'Kindergarten', asn: '316664556', dateOfBirth: 'Jan 28, 2021', gender: 'Male', sped: 'Not Coded' },
  { name: 'Appannah, Rayah Candace', grade: 'Kindergarten', asn: '317246890', dateOfBirth: 'Jun 14, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Auger, Ava Joyce', grade: 'Kindergarten', asn: '317433571', dateOfBirth: 'Apr 30, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Balmores, Adela Claire Sombillo', grade: 'Kindergarten', asn: '317142875', dateOfBirth: 'Nov 22, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Batt, Griffin James', grade: 'Kindergarten', asn: '317294999', dateOfBirth: 'Jan 06, 2021', gender: 'Male', sped: 'Not Coded' },
  { name: 'Beaulieu, Mandy Jazlyn', grade: 'Kindergarten', asn: '317245462', dateOfBirth: 'Jan 28, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Brand, Millie Ursula', grade: 'Kindergarten', asn: '317146926', dateOfBirth: 'Jul 08, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Braun, Oaklynn Susanna Grace', grade: 'Kindergarten', asn: '317147049', dateOfBirth: 'Oct 26, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Cole, Layla Aurora', grade: 'Kindergarten', asn: '317147122', dateOfBirth: 'Dec 21, 2021', gender: 'Female', sped: 'Not Coded' },
  { name: 'Dadiz-Parsons, Matteo Lee', grade: 'Kindergarten', asn: '315463893', dateOfBirth: 'Jan 05, 2021', gender: 'Male', sped: 'Not Coded' },
]

const assessmentHistoryPreview: Record<string, AssessmentHistoryPreview> = {
  CTOPP: { schoolYear: '2026 / 2027', period: 'Fall', standardScore: 95, descriptiveTerm: 'Average', termLevel: 4 },
  TOSREC: { schoolYear: '2026 / 2027', period: 'Fall', standardScore: 95, descriptiveTerm: 'Average', termLevel: 4 },
}

const programPlanModules = [
  { name: 'Student Details', group: 'General', locked: true, notes: false },
  { name: 'Screener Results', group: 'General', locked: true, notes: true },
  { name: 'Intervention Focus', group: 'General', locked: true, notes: true },
  { name: 'Student Conditions and Coding', group: 'General', locked: true, notes: false },
  { name: 'Strengths', group: 'General', locked: false, notes: false },
  { name: 'Teacher Comment and Next Steps', group: 'General', locked: true, notes: false },
  { name: 'Signatures', group: 'General', locked: false, notes: false },
  { name: 'Empower Reading', group: 'English Language Arts and Literature', locked: true, notes: true },
  { name: 'Oral Reading Fluency (ORF)', group: 'English Language Arts and Literature', locked: true, notes: false },
  { name: 'Word Study', group: 'English Language Arts and Literature', locked: true, notes: false },
  { name: 'Writing Snapshot', group: 'English Language Arts and Literature', locked: true, notes: false },
  { name: 'Mathematics', group: 'Mathematics', locked: true, notes: true },
]

const programPlanModuleGroups = ['General', 'English Language Arts and Literature', 'Mathematics']
const shellSignInHref = '/api/auth/signin?returnUrl=%2F%3Fshell-preview'
const shellSignOutHref = '/api/auth/signout?returnUrl=%2F%3Fshell-preview'

const programPlanDescriptions: Record<string, string> = {
  'Student Details': 'Review the student demographic, enrolment, school, and attendance information used throughout the plan.',
  'Screener Results': 'Review the latest governed screener results and use the evidence to inform goals and supports.',
  'Intervention Focus': 'Review the student’s current intervention focus, responsible staff, and dates of service.',
  'Student Conditions and Coding': 'Record identified conditions, learning needs, and special education coding.',
  'Empower Reading': 'Track progress in the Empower Reading intervention program and its governed goals.',
  Strengths: 'Describe the student’s strengths, interests, and successful learning conditions.',
  'Oral Reading Fluency (ORF)': 'Record connected-text fluency, accuracy, and words read correctly per minute.',
  'Word Study': 'Track the student’s current Words Their Way developmental stage and progress.',
  'Writing Snapshot': 'Present current writing evidence and a representative writing sample.',
  Mathematics: 'Review mathematics outcomes, current achievement, and progress over time.',
  'Teacher Comment and Next Steps': 'Summarize progress, strengths, priorities, and the next instructional steps.',
  Signatures: 'Present the governed signatory order and signature fields for the exported plan.',
}

function getHistoryAssessmentGroups(grade: string, sectionGroup: string) {
  let literacy: string[]
  let numeracy: string[]

  if (grade === 'Kindergarten') {
    literacy = ['CTOPP', 'LeNS', 'ADLOF']
    numeracy = ['PNSA']
  } else if (grade === 'Grade 1') {
    literacy = ['CTOPP', 'LeNS', 'TOSREC', 'TOWRE']
    numeracy = ['PNSA', 'WRAT-5']
  } else if (grade === 'Grade 2') {
    literacy = ['LeNS', 'TOSREC', 'TOWRE']
    numeracy = ['PNSA', 'WRAT-5']
  } else if (grade === 'Grade 3') {
    literacy = ['LeNS', 'TOSREC', 'TOSWRF', 'TOWRE']
    numeracy = ['PNSA', 'WRAT-5']
  } else {
    literacy = ['TOSREC', 'TOWRE']
    numeracy = ['PNSA', 'WRAT-5']
  }

  if (sectionGroup === 'Numeracy') return numeracy
  if (sectionGroup === 'Foundations' || sectionGroup === 'Homeroom') return [...literacy, ...numeracy]
  return literacy
}

function getSectionsForGroup(sectionGroup: string) {
  if (sectionGroup === 'Foundations') return foundationsSections
  if (sectionGroup === 'Homeroom') return homeroomSections
  return literacySections
}

export function HighDensityShellPreview() {
  const [user, setUser] = useState<ShellUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [accessContext, setAccessContext] = useState<ShellAccessContext | null>(null)
  const [developmentAccessContext, setDevelopmentAccessContext] = useState<ShellAccessContext | null>(null)
  const [developmentAccessChecked, setDevelopmentAccessChecked] = useState(true)
  const [securityChecked, setSecurityChecked] = useState(false)
  const [securityError, setSecurityError] = useState(false)
  const [fabricConnection, setFabricConnection] = useState<ShellConnectionStatus | null>(null)
  const [fabricChecked, setFabricChecked] = useState(false)
  const [fabricError, setFabricError] = useState(false)
  const [copilotAccess, setCopilotAccess] = useState<CopilotAccessStatus | null>(null)
  const [copilotChecked, setCopilotChecked] = useState(false)
  const [reauthorizeUrl, setReauthorizeUrl] = useState<string | null>(null)
  const [roleChanging, setRoleChanging] = useState<string | null>(null)
  const [roleChangeError, setRoleChangeError] = useState('')
  const [developmentUserChanging, setDevelopmentUserChanging] = useState(false)
  const [developmentUserError, setDevelopmentUserError] = useState('')
  const [studentDisplayMode, setStudentDisplayMode] = useState<StudentDisplayMode>('real')

  useEffect(() => {
    let cancelled = false
    getShellJson<ShellUser>('/api/me')
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user) {
      setAccessContext(null)
      setSecurityChecked(false)
      return
    }
    let cancelled = false
    setSecurityChecked(false)
    setSecurityError(false)
    setReauthorizeUrl(null)
    getShellJson<ShellAccessContext>('/api/dataverse/access-context')
      .then((context) => {
        if (!cancelled) setAccessContext(context)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const reconnectUrl = getReauthorizeUrl(error)
        if (reconnectUrl) setReauthorizeUrl(reconnectUrl)
        else setSecurityError(true)
      })
      .finally(() => {
        if (!cancelled) setSecurityChecked(true)
      })
    return () => { cancelled = true }
  }, [user?.email])

  useEffect(() => {
    if (!user) {
      setCopilotAccess(null)
      setCopilotChecked(false)
      return
    }

    let cancelled = false
    setCopilotChecked(false)
    getShellJson<CopilotAccessStatus>('/api/copilot/access')
      .then((status) => {
        if (!cancelled) setCopilotAccess(status)
      })
      .catch(() => {
        if (!cancelled) {
          setCopilotAccess({
            experience: 'CopilotChat',
            hasMicrosoft365Copilot: false,
            workIqAvailable: false,
            workIqStatus: 'UnableToConfirm',
            workBasedBillingPolicyStatus: 'NotEvaluated',
            workBasedBillingStatus: 'NotEvaluated',
            licenseCheckStatus: 'NotConnected',
            source: 'Fallback',
            message: 'Microsoft 365 Copilot licensing could not be confirmed. Copilot Chat remains available.',
            checkedAtUtc: new Date().toISOString(),
          })
        }
      })
      .finally(() => {
        if (!cancelled) setCopilotChecked(true)
      })
    return () => { cancelled = true }
  }, [user?.email])

  useEffect(() => {
    if (!user?.activeDevelopmentUserEmail) {
      setDevelopmentAccessContext(null)
      setDevelopmentAccessChecked(true)
      return
    }

    let cancelled = false
    setDevelopmentAccessChecked(false)
    setDevelopmentUserError('')
    getShellJson<ShellAccessContext>('/api/development/user-context')
      .then((context) => {
        if (!cancelled) setDevelopmentAccessContext(context)
      })
      .catch(() => {
        if (!cancelled) {
          setDevelopmentAccessContext(null)
          setDevelopmentUserError('The selected user’s Dataverse scope could not be loaded.')
        }
      })
      .finally(() => {
        if (!cancelled) setDevelopmentAccessChecked(true)
      })
    return () => { cancelled = true }
  }, [user?.activeDevelopmentUserEmail])

  useEffect(() => {
    if (!user) {
      setFabricConnection(null)
      setFabricChecked(false)
      return
    }
    let cancelled = false
    setFabricChecked(false)
    setFabricError(false)
    getShellJson<ShellConnectionStatus>('/api/semantic-model/status')
      .then((connection) => {
        if (!cancelled) setFabricConnection(connection)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const reconnectUrl = getReauthorizeUrl(error)
        if (reconnectUrl) setReauthorizeUrl(reconnectUrl)
        else setFabricError(true)
      })
      .finally(() => {
        if (!cancelled) setFabricChecked(true)
      })
    return () => { cancelled = true }
  }, [user?.email])

  const changeDevelopmentRole = async (role: string) => {
    if (!user?.isDeveloper || user.activeDevelopmentUserEmail || role === user.activeDevelopmentRole) return
    setRoleChanging(role)
    setRoleChangeError('')
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
      const update = await response.json() as ShellRoleChangeResponse
      setUser((current) => current ? {
        ...current,
        activeDevelopmentRole: update.activeDevelopmentRole,
        rlsIdentity: update.rlsIdentity,
        rlsEvaluation: update.rlsEvaluation,
      } : current)
    } catch {
      setRoleChangeError('The simulated role could not be changed. Your governed identity was not altered.')
    } finally {
      setRoleChanging(null)
    }
  }

  const changeDevelopmentUser = async (email: string) => {
    if (!user?.isDeveloper) return
    setDevelopmentUserChanging(true)
    setDevelopmentUserError('')
    try {
      const response = await fetch('/api/development/user', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-FVSD-Development-Request': 'user-switcher',
        },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(`${response.status}`)
      window.location.reload()
    } catch {
      setDevelopmentUserError('The user preview could not be started. Confirm the email address and try again.')
      setDevelopmentUserChanging(false)
    }
  }

  const clearDevelopmentUser = async () => {
    if (!user?.isDeveloper) return
    setDevelopmentUserChanging(true)
    setDevelopmentUserError('')
    try {
      const response = await fetch('/api/development/user', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-FVSD-Development-Request': 'user-switcher' },
      })
      if (!response.ok) throw new Error(`${response.status}`)
      window.location.reload()
    } catch {
      setDevelopmentUserError('The simulated user could not be cleared. Please try again.')
      setDevelopmentUserChanging(false)
    }
  }

  if (!authChecked) {
    return <ShellOpeningState mode="loading" />
  }

  if (!user) {
    return <ShellOpeningState mode="signed-out" />
  }

  if (!securityChecked || !fabricChecked || !copilotChecked || !developmentAccessChecked) {
    return <ShellOpeningState mode="loading-access" user={user} accessContext={accessContext} fabricConnection={fabricConnection} copilotAccess={copilotAccess} />
  }

  if (reauthorizeUrl) {
    return <ShellOpeningState mode="reconnect" user={user} accessContext={accessContext} fabricConnection={fabricConnection} copilotAccess={copilotAccess} reauthorizeUrl={reauthorizeUrl} />
  }

  if (securityError || fabricError) {
    return <ShellOpeningState mode="security-error" user={user} accessContext={accessContext} fabricConnection={fabricConnection} copilotAccess={copilotAccess} dataverseFailed={securityError} fabricFailed={fabricError} />
  }

  const fabricConnected = fabricConnection?.status.toLowerCase() === 'connected'
  if (!accessContext?.roleRecordFound || !accessContext.pocEnabled || accessContext.effectiveRole === 'No Access' || !fabricConnected) {
    return <ShellOpeningState mode="access-denied" user={user} accessContext={accessContext} fabricConnection={fabricConnection} copilotAccess={copilotAccess} dataverseFailed={!accessContext?.roleRecordFound || !accessContext.pocEnabled || accessContext.effectiveRole === 'No Access'} fabricFailed={!fabricConnected} />
  }

  const workspaceAccessContext = developmentAccessContext ?? accessContext
  const effectiveRole = normalizeRoleName(user.isDeveloper
    ? user.activeDevelopmentUserEmail
      ? workspaceAccessContext.effectiveRole
      : user.activeDevelopmentRole ?? accessContext.effectiveRole
    : accessContext.effectiveRole)

  return (
    <HighDensityShellWorkspace
      user={user}
      accessContext={workspaceAccessContext}
      fabricConnection={fabricConnection}
      copilotAccess={copilotAccess}
      effectiveRole={effectiveRole}
      roleChanging={roleChanging}
      roleChangeError={roleChangeError}
      onRoleChange={changeDevelopmentRole}
      developmentUserChanging={developmentUserChanging}
      developmentUserError={developmentUserError}
      onDevelopmentUserChange={changeDevelopmentUser}
      onDevelopmentUserClear={clearDevelopmentUser}
      studentDisplayMode={studentDisplayMode}
      onStudentDisplayModeChange={setStudentDisplayMode}
    />
  )
}

function buildAccessSupportMailto(user: ShellUser, accessContext?: ShellAccessContext | null, fabricConnection?: ShellConnectionStatus | null, copilotAccess?: CopilotAccessStatus | null) {
  const schoolAssignments = [accessContext?.primarySchool?.name, accessContext?.alternativeSchool?.name].filter(Boolean).join(' / ') || 'Not available'
  const body = [
    'Hello FVSD Helpdesk,',
    '',
    'I am unable to complete the FVSD Nexus access verification. Please confirm my Dataverse and Microsoft Fabric licensing, access, and role assignment.',
    '',
    `Name: ${user.name}`,
    `Email: ${user.email ?? accessContext?.email ?? 'Not available'}`,
    'Microsoft Entra ID: Authenticated',
    `Dataverse role record: ${accessContext?.roleRecordFound ? 'Found' : 'Not verified'}`,
    `Nexus application enabled: ${accessContext ? (accessContext.pocEnabled ? 'Yes' : 'No') : 'Not verified'}`,
    `Effective Nexus role: ${accessContext?.effectiveRole ?? 'Not available'}`,
    `School assignment: ${schoolAssignments}`,
    `Microsoft Fabric: ${fabricConnection?.status ?? 'Not verified'}`,
    `Fabric workspace/model: ${fabricConnection ? `${fabricConnection.workspace} / ${fabricConnection.semanticModel}` : 'Not available'}`,
    `Copilot experience: ${copilotAccess?.experience === 'Microsoft365Copilot' ? 'Microsoft 365 Copilot with Work IQ' : 'Copilot Chat'}`,
    `Copilot licence check: ${copilotAccess?.licenseCheckStatus ?? 'Not verified'}`,
    '',
    'Please contact me if any additional information is required.',
  ].join('\n')
  const subject = `FVSD Nexus access and licensing request - ${user.name}`
  return `mailto:helpdesk@fvsd.ab.ca?cc=${encodeURIComponent('scottm@fvsd.ab.ca')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function ShellOpeningState({ mode, user, accessContext, fabricConnection, copilotAccess, dataverseFailed = false, fabricFailed = false, reauthorizeUrl }: {
  mode: 'loading' | 'signed-out' | 'loading-access' | 'reconnect' | 'security-error' | 'access-denied'
  user?: ShellUser
  accessContext?: ShellAccessContext | null
  fabricConnection?: ShellConnectionStatus | null
  copilotAccess?: CopilotAccessStatus | null
  dataverseFailed?: boolean
  fabricFailed?: boolean
  reauthorizeUrl?: string
}) {
  const loading = mode === 'loading' || mode === 'loading-access'
  const firstName = user?.name.split(/\s+/).filter(Boolean)[0]
  const title = mode === 'signed-out'
    ? 'Welcome back'
    : mode === 'access-denied'
      ? 'Your Nexus access needs attention'
      : mode === 'reconnect'
        ? 'Reconnect Microsoft services'
      : mode === 'security-error'
        ? 'We could not finish verification'
        : mode === 'loading-access'
          ? `Welcome${firstName ? `, ${firstName}` : ''}`
          : 'Opening FVSD Nexus'
  const description = mode === 'signed-out'
    ? 'Continue with your FVSD Microsoft account. Your governed role and school assignments decide what you can see.'
    : mode === 'access-denied'
      ? 'Your Microsoft identity is valid, but one or more governed service prerequisites could not be confirmed.'
      : mode === 'reconnect'
        ? 'Your FVSD identity is still signed in, but the delegated Dataverse and Fabric session needs to be renewed.'
      : mode === 'security-error'
        ? 'Nexus could not confirm all required service connections. You can retry or prepare a Helpdesk request with your identity and verification details.'
        : mode === 'loading-access'
          ? 'Your Microsoft sign-in is complete. Nexus is now confirming Dataverse, Fabric, and Microsoft 365 Copilot capabilities.'
          : 'Checking for an existing FVSD Microsoft session.'
  const supportHref = user ? buildAccessSupportMailto(user, accessContext, fabricConnection, copilotAccess) : undefined
  const dataverseReady = Boolean(accessContext?.roleRecordFound && accessContext.pocEnabled && accessContext.effectiveRole !== 'No Access')
  const fabricReady = fabricConnection?.status.toLowerCase() === 'connected'
  const copilotConfirmed = copilotAccess?.licenseCheckStatus === 'Connected'
  const copilotReady = Boolean(copilotAccess && copilotConfirmed)
  const copilotUnconfirmed = Boolean(copilotAccess && !copilotConfirmed)
  const copilotLabel = copilotConfirmed
    ? copilotAccess?.hasMicrosoft365Copilot
      ? 'Microsoft 365 Copilot'
      : 'Copilot Chat'
    : 'Microsoft 365 Copilot'
  const copilotDetail = !copilotConfirmed
    ? 'Licence could not be verified · Copilot Chat remains available'
    : copilotAccess?.hasMicrosoft365Copilot
      ? copilotAccess.workIqAvailable
        ? 'Work IQ available · subject to spending policy'
        : 'Licence confirmed · Work-Based Billing policy required'
      : 'Copilot Chat available'

  return (
    <main className="hd-opening-screen" data-state={mode}>
      <section className="hd-opening-story" aria-label="FVSD Nexus">
        <header><img src={nexusLogo} alt="" /><div><strong>FVSD Nexus</strong><span>Fort Vermilion School Division</span></div></header>
        <div className="hd-opening-story__content">
          <img src={nexusLogo} alt="FVSD Nexus" />
          <h1>From insights to action.</h1>
          <p>One place for literacy and numeracy screening, class assignments, and Student Program Plans—built on the division’s governed data.</p>
          <ul>
            <li><BarChart3 aria-hidden="true" /><span>Division and school achievement signals</span></li>
            <li><ClipboardCheck aria-hidden="true" /><span>Assessment entry and completion tracking</span></li>
            <li><GraduationCap aria-hidden="true" /><span>Individual Education and Program Plans</span></li>
          </ul>
        </div>
        <footer>Fort Vermilion School Division · Internal staff application</footer>
      </section>

      <section className="hd-opening-panel" aria-live="polite">
        <div className="hd-opening-card">
          <span className="hd-opening-card__eyebrow">{user ? 'Secure access check' : 'Staff sign-in'}</span>
          <h2>{title}</h2>
          <p>{description}</p>

          {user ? (
            <div className="hd-opening-identity">
              <span aria-hidden="true">{getInitials(user.name)}</span>
              <div><strong>{user.name}</strong><small>{user.email ?? accessContext?.email}</small></div>
              <ShieldCheck aria-label="Microsoft identity verified" />
            </div>
          ) : null}

          {mode !== 'signed-out' && user ? (
            <div className="hd-opening-checks" aria-label="Access verification status">
              <div className="is-ready"><CheckCircle2 aria-hidden="true" /><span><strong>Microsoft Entra ID</strong><small>Identity confirmed</small></span></div>
              <div className={dataverseReady ? 'is-ready' : dataverseFailed ? 'is-error' : 'is-pending'}>
                {dataverseReady ? <CheckCircle2 aria-hidden="true" /> : dataverseFailed ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                <span><strong>Microsoft Dataverse</strong><small>{dataverseReady ? `${formatRoleLabel(accessContext?.effectiveRole ?? 'FVSD user')} · role and school scope confirmed` : dataverseFailed ? 'Access, licensing, or role assignment requires review' : 'Checking access and role assignment'}</small></span>
              </div>
              <div className={fabricReady ? 'is-ready' : fabricFailed ? 'is-error' : 'is-pending'}>
                {fabricReady ? <CheckCircle2 aria-hidden="true" /> : fabricFailed ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                <span><strong>Microsoft Fabric</strong><small>{fabricReady ? `${fabricConnection?.semanticModel} · delegated access confirmed` : fabricFailed ? 'Access or licensing requires review' : 'Checking governed analytics access'}</small></span>
              </div>
              <div className={copilotReady ? 'is-ready' : copilotUnconfirmed ? 'is-error' : 'is-pending'}>
                {copilotReady ? <CheckCircle2 aria-hidden="true" /> : copilotUnconfirmed ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                <span><strong>{copilotLabel}</strong><small>{copilotAccess ? copilotDetail : 'Checking Copilot capability'}</small></span>
              </div>
            </div>
          ) : null}

          {loading ? <div className="hd-opening-card__loading" role="status"><RefreshCw className="is-spinning" aria-hidden="true" /> {user ? 'Verifying governed services…' : 'Checking your session…'}</div> : null}
          {mode === 'signed-out' ? <a className="hd-opening-card__primary" href={shellSignInHref}><LogIn aria-hidden="true" /> Continue with Microsoft</a> : null}
          {mode === 'reconnect' ? <a className="hd-opening-card__primary" href={`${reauthorizeUrl ?? '/api/auth/signin'}?returnUrl=%2F%3Fshell-preview`}><RefreshCw aria-hidden="true" /> Reconnect Microsoft services</a> : null}
          {mode === 'security-error' ? <button className="hd-opening-card__primary" type="button" onClick={() => window.location.reload()}><RefreshCw aria-hidden="true" /> Retry verification</button> : null}
          {(mode === 'security-error' || mode === 'access-denied') && supportHref ? <a className="hd-opening-card__support" href={supportHref}><Mail aria-hidden="true" /> Prepare Helpdesk email</a> : null}
          {mode === 'access-denied' ? <a className="hd-opening-card__secondary" href={shellSignOutHref}>Use a different account</a> : null}
          <footer><ShieldCheck aria-hidden="true" /><span>Secured by FVSD Entra ID</span></footer>
        </div>
      </section>
    </main>
  )
}

type HighDensityShellWorkspaceProps = {
  user: ShellUser
  accessContext: ShellAccessContext
  fabricConnection: ShellConnectionStatus
  copilotAccess: CopilotAccessStatus | null
  effectiveRole: string
  roleChanging: string | null
  roleChangeError: string
  onRoleChange: (role: string) => void
  developmentUserChanging: boolean
  developmentUserError: string
  onDevelopmentUserChange: (email: string) => Promise<void>
  onDevelopmentUserClear: () => Promise<void>
  studentDisplayMode: StudentDisplayMode
  onStudentDisplayModeChange: (mode: StudentDisplayMode) => void
}

function HighDensityShellWorkspace({
  user,
  accessContext,
  fabricConnection,
  copilotAccess,
  effectiveRole,
  roleChanging,
  roleChangeError,
  onRoleChange,
  developmentUserChanging,
  developmentUserError,
  onDevelopmentUserChange,
  onDevelopmentUserClear,
  studentDisplayMode,
  onStudentDisplayModeChange,
}: HighDensityShellWorkspaceProps) {
  const [navigationMode, setNavigationMode] = useState<'expanded' | 'rail'>('expanded')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [developmentRailOpen, setDevelopmentRailOpen] = useState(false)
  const [developmentUserEmail, setDevelopmentUserEmail] = useState(user.activeDevelopmentUserEmail ?? '')
  const [activeItem, setActiveItem] = useState('class-assignments')
  const [expandedGroup, setExpandedGroup] = useState<string | null>('administration')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [schoolFilter, setSchoolFilter] = useState('Florence MacDougall Community School')
  const [sectionGroupFilter, setSectionGroupFilter] = useState('Literacy')
  const [courseFilter, setCourseFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState('')
  const [selectedClass, setSelectedClass] = useState<SelectedClass | null>(null)
  const [historyView, setHistoryView] = useState<HistoryView>('assessment')
  const [historyPeriod, setHistoryPeriod] = useState<'current' | 'previous'>('current')
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('')
  const [assessmentModal, setAssessmentModal] = useState<AssessmentModalState>(null)
  const [programPlanOpen, setProgramPlanOpen] = useState(false)
  const [liveIppPreviewContext, setLiveIppPreviewContext] = useState<IppPreviewContext | null>(null)
  const [activePlanModule, setActivePlanModule] = useState('Student Details')
  const [planRail, setPlanRail] = useState<PlanRail>(null)
  const [showModuleDescriptions, setShowModuleDescriptions] = useState(false)
  const [includedPlanModules, setIncludedPlanModules] = useState(() => new Set(programPlanModules.map((module) => module.name)))
  const [exportedPlanModules, setExportedPlanModules] = useState(() => new Set(programPlanModules.map((module) => module.name)))
  const [notesAfterPlanSections, setNotesAfterPlanSections] = useState(() => new Set<string>())
  const [analyticsSchoolYear, setAnalyticsSchoolYear] = useState('2026 / 2027')
  const [analyticsPeriod, setAnalyticsPeriod] = useState('All periods')
  const [analyticsSchool, setAnalyticsSchool] = useState('All permitted schools')
  const [analyticsGrade, setAnalyticsGrade] = useState('All grades')
  const [analyticsFocus, setAnalyticsFocus] = useState<AnalyticsFocus>('Literacy')
  const [analyticsAssessment, setAnalyticsAssessment] = useState('TOSREC')
  const [collapsedAnalyticsSchools, setCollapsedAnalyticsSchools] = useState(() => new Set<string>())
  const [liveClassAssignmentContext, setLiveClassAssignmentContext] = useState<{ breadcrumb: string[]; filterCount: number }>({
    breadcrumb: [],
    filterCount: 0,
  })
  const [liveScreenersContext, setLiveScreenersContext] = useState<{ breadcrumb: string[]; filterCount: number }>({
    breadcrumb: [],
    filterCount: 0,
  })
  const [liveProgramPlansContext, setLiveProgramPlansContext] = useState<{ breadcrumb: string[]; filterCount: number }>({ breadcrumb: [], filterCount: 0 })
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const navigationGroups = getNavigationGroups(effectiveRole)

  const closeDevelopmentRail = () => {
    setDevelopmentRailOpen(false)
    if (user.activeDevelopmentUserEmail || user.activeDevelopmentRole) {
      void onDevelopmentUserClear()
    } else {
      setDevelopmentUserEmail('')
    }
  }

  const availableSections = getSectionsForGroup(sectionGroupFilter)
  const isScreenersDashboard = activeItem === 'assessments'
  const isProgramPlansDashboard = activeItem === 'individual-plans'
  const isAnalyticsOverview = activeItem === 'overview'
  const isSecuritySettings = activeItem === 'settings'
  const availableSectionCount = availableSections.reduce((total, course) => total + course.teachers.length, 0)
  const filterBreadcrumb = [schoolFilter, sectionGroupFilter, courseFilter, teacherFilter, studentFilter].filter(Boolean)
  const selectedFilterCount = filterBreadcrumb.length
    + (historyView === 'program-plan' ? 1 : 0)
    + (historyPeriod === 'previous' ? 1 : 0)
    + (assessmentTypeFilter ? 1 : 0)
  const selectedStudent = studentFilter ? studentRoster.find((student) => student.name === studentFilter) ?? null : null
  const visibleStudents = studentFilter ? studentRoster.filter((student) => student.name === studentFilter) : studentRoster
  const historyAssessmentGroups = selectedStudent ? getHistoryAssessmentGroups(selectedStudent.grade, sectionGroupFilter) : []
  const visibleHistoryAssessmentGroups = assessmentTypeFilter ? [assessmentTypeFilter] : historyAssessmentGroups
  const supportsProgramPlans = sectionGroupFilter === 'Foundations' || sectionGroupFilter === 'Homeroom'
  const canAddAssessment = sectionGroupFilter === 'Literacy'
    || sectionGroupFilter === 'Numeracy'
    || sectionGroupFilter === 'Foundations'
  const hasCurrentProgramPlan = selectedStudent?.asn === '999999'
  const analyticsBreadcrumb = [analyticsFocus, analyticsAssessment, analyticsSchool === 'All permitted schools' ? '' : analyticsSchool, analyticsPeriod === 'All periods' ? '' : analyticsPeriod].filter(Boolean)
  const workspaceBreadcrumb = liveIppPreviewContext
    ? [liveIppPreviewContext.studentName, 'Student Program Plan']
    : programPlanOpen && selectedStudent
    ? [selectedStudent.name, 'Student Program Plan']
    : isSecuritySettings
      ? []
      : isScreenersDashboard
      ? liveScreenersContext.breadcrumb
      : isProgramPlansDashboard
        ? liveProgramPlansContext.breadcrumb
        : isAnalyticsOverview
          ? analyticsBreadcrumb
          : activeItem === 'class-assignments'
            ? liveClassAssignmentContext.breadcrumb
            : filterBreadcrumb
  const activeFilterCount = isScreenersDashboard
    ? liveScreenersContext.filterCount
    : isProgramPlansDashboard
      ? liveProgramPlansContext.filterCount
      : isAnalyticsOverview
        ? analyticsBreadcrumb.length + (analyticsGrade !== 'All grades' ? 1 : 0) + (analyticsSchoolYear !== '2026 / 2027' ? 1 : 0)
        : activeItem === 'class-assignments'
          ? liveClassAssignmentContext.filterCount
          : selectedFilterCount
  const workspaceArea = isAnalyticsOverview ? 'Analytics' : isSecuritySettings ? 'Security' : 'Administration'
  const workspaceTitle = liveIppPreviewContext
    ? 'Student Program Plan'
    : isScreenersDashboard
    ? 'Student Screeners'
    : isProgramPlansDashboard
      ? 'Student Program Plans'
      : isAnalyticsOverview
        ? 'Analytics Overview'
        : isSecuritySettings
          ? 'Security & Access'
          : 'Class Assignment'
  const visiblePlanModules = programPlanModules.filter((module) => includedPlanModules.has(module.name))

  useEffect(() => {
    const permittedItems = new Set(navigationGroups.flatMap((group) => group.items.map((item) => item.id)))
    permittedItems.add('settings')
    if (!permittedItems.has(activeItem)) {
      setActiveItem(navigationGroups[0]?.items[0]?.id ?? 'settings')
    }
  }, [activeItem, effectiveRole])
  const analyticsComparisonRows = [
    { school: 'Blue Hills Community School', grade: 'Grade 2', fallFoundation: 70, fallCurriculum: 92, winterFoundation: 76, winterCurriculum: 96, springFoundation: 81, springCurriculum: 99 },
    { school: 'Blue Hills Community School', grade: 'Grade 3', fallFoundation: 83, fallCurriculum: 100, winterFoundation: 86, winterCurriculum: 101, springFoundation: 89, springCurriculum: 103 },
    { school: 'Blue Hills Community School', grade: 'Grade 5', fallFoundation: 81, fallCurriculum: 106, winterFoundation: 85, winterCurriculum: 108, springFoundation: 88, springCurriculum: 109 },
    { school: 'Buffalo Head Prairie School', grade: 'Grade 2', fallFoundation: 75, fallCurriculum: 99, winterFoundation: 79, winterCurriculum: 101, springFoundation: 83, springCurriculum: 104 },
    { school: 'Florence MacDougall Community School', grade: 'Grade 3', fallFoundation: 79, fallCurriculum: 97, winterFoundation: 82, winterCurriculum: 100, springFoundation: 86, springCurriculum: 102 },
    { school: 'Sand Hills Elementary School', grade: 'Grade 4', fallFoundation: 72, fallCurriculum: 94, winterFoundation: 77, winterCurriculum: 97, springFoundation: 80, springCurriculum: 99 },
  ]
  const visibleAnalyticsComparisonRows = analyticsComparisonRows
    .filter((row) => analyticsSchool === 'All permitted schools' || row.school === analyticsSchool)
    .filter((row) => analyticsGrade === 'All grades' || row.grade === analyticsGrade)
  const analyticsComparisonGroups = Array.from(
    visibleAnalyticsComparisonRows.reduce((groups, row) => {
      const schoolRows = groups.get(row.school) ?? []
      schoolRows.push(row)
      groups.set(row.school, schoolRows)
      return groups
    }, new Map<string, typeof analyticsComparisonRows>()),
  )

  const toggleSetValue = (setter: Dispatch<SetStateAction<Set<string>>>, value: string) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const togglePlanModule = (moduleName: string) => {
    const module = programPlanModules.find((item) => item.name === moduleName)
    if (!module || module.locked) return

    const isIncluded = includedPlanModules.has(moduleName)
    if (isIncluded && activePlanModule === moduleName) setActivePlanModule('Student Details')
    if (!isIncluded) setExportedPlanModules((exports) => new Set(exports).add(moduleName))

    setIncludedPlanModules((current) => {
      const next = new Set(current)
      if (next.has(moduleName)) next.delete(moduleName)
      else next.add(moduleName)
      return next
    })
  }

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        mobileTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  useEffect(() => {
    if (!filtersOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && window.matchMedia('(max-width: 899px)').matches) {
        setFiltersOpen(false)
        filterTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [filtersOpen])

  const chooseDestination = (id: string) => {
    setActiveItem(id)
    setProgramPlanOpen(false)
    setPlanRail(null)
    if (id === 'assessments') {
      setFiltersOpen(true)
      setAssessmentTypeFilter((current) => current || 'TOSREC')
    }
    if (id === 'individual-plans') {
      setFiltersOpen(true)
      setAssessmentTypeFilter('')
    }
    if (id === 'overview') setFiltersOpen(true)
    setMobileOpen(false)
    setDevelopmentRailOpen(false)
  }

  const toggleGroup = (id: string) => {
    setExpandedGroup((current) => current === id ? null : id)
  }

  const openClass = (course: CourseSection, teacher: TeacherSection) => {
    setCourseFilter(course.name)
    setTeacherFilter(teacher.name)
    setStudentFilter('')
    setHistoryView('assessment')
    setHistoryPeriod('current')
    setAssessmentTypeFilter('')
    setSelectedClass({ course, teacher })
  }

  const closeClass = () => {
    setTeacherFilter('')
    setStudentFilter('')
    setHistoryView('assessment')
    setHistoryPeriod('current')
    setAssessmentTypeFilter('')
    setSelectedClass(null)
  }

  return (
    <div
      className="hd-shell-preview"
      data-navigation={navigationMode}
      data-mobile-navigation={mobileOpen ? 'open' : 'closed'}
      data-visual-regression="high-density-shell"
    >
      <button
        type="button"
        className="hd-shell-preview__backdrop"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />

      <aside className="hd-navigation" aria-label="Preview navigation">
        <header className="hd-navigation__brand">
          <img src={nexusLogo} alt="" />
          <div className="hd-navigation__brand-copy">
            <strong>FVSD Nexus</strong>
            <span>Fort Vermilion School Division</span>
          </div>
          <button
            type="button"
            className="hd-navigation__desktop-toggle"
            aria-label={navigationMode === 'expanded' ? 'Collapse navigation to rail' : 'Expand navigation'}
            title={navigationMode === 'expanded' ? 'Collapse navigation' : 'Expand navigation'}
            onClick={() => setNavigationMode((mode) => mode === 'expanded' ? 'rail' : 'expanded')}
          >
            {navigationMode === 'expanded' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="hd-navigation__mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <nav className="hd-navigation__destinations" aria-label="Main navigation">
          {navigationGroups.map(({ id, label, icon: GroupIcon, items }) => {
            const isExpanded = expandedGroup === id
            const groupItemsId = `hd-navigation-${id}-items`
            return (
            <section className="hd-navigation__group" key={id} aria-labelledby={`hd-navigation-${id}`}>
              <h2 id={`hd-navigation-${id}`}>
                <button
                  type="button"
                  aria-label={label}
                  aria-expanded={isExpanded}
                  aria-controls={groupItemsId}
                  title={label}
                  onClick={() => toggleGroup(id)}
                >
                  <GroupIcon aria-hidden="true" />
                  <span>{label}</span>
                  <ChevronDown className="hd-navigation__group-chevron" aria-hidden="true" />
                </button>
              </h2>
              {isExpanded ? <div id={groupItemsId}>
                {items.map(({ id: itemId, label: itemLabel, icon: Icon, soon }) => (
                  <button
                    type="button"
                    key={itemId}
                    className={activeItem === itemId ? 'hd-navigation__item is-active' : 'hd-navigation__item'}
                    aria-current={activeItem === itemId ? 'page' : undefined}
                    aria-label={itemLabel}
                    title={itemLabel}
                    onClick={() => chooseDestination(itemId)}
                  >
                    <Icon aria-hidden="true" />
                    <span className="hd-navigation__item-label">{itemLabel}</span>
                    {soon ? <span className="hd-navigation__soon">Soon</span> : null}
                  </button>
                ))}
              </div> : null}
            </section>
            )
          })}
          <section className="hd-navigation__group hd-navigation__settings">
            <div>
              <button
                type="button"
                className={isSecuritySettings ? 'hd-navigation__item is-active' : 'hd-navigation__item'}
                aria-label="Security and access"
                aria-current={isSecuritySettings ? 'page' : undefined}
                title="Security and access"
                onClick={() => chooseDestination('settings')}
              >
                <Settings aria-hidden="true" />
                <span className="hd-navigation__item-label">Security &amp; Access</span>
              </button>
            </div>
          </section>
        </nav>

        <footer className="hd-navigation__footer">
          <div className="hd-navigation__role">
            <ShieldCheck aria-hidden="true" />
            <div><span>{user.isDeveloper ? 'Preview role' : 'Current role'}</span><strong>{formatRoleLabel(effectiveRole)}</strong></div>
          </div>
          <div className="hd-navigation__account">
            <span aria-hidden="true">{getInitials(user.name)}</span>
            <div><strong>{user.name}</strong><small>{user.email ?? accessContext.email}</small></div>
          </div>
        </footer>
      </aside>

      <main className="hd-workspace container-workspace">
        <header className="hd-workspace__header">
          <button
            ref={mobileTriggerRef}
            type="button"
            className="hd-workspace__mobile-menu"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="hd-workspace__heading">
            <span>{workspaceArea}</span>
            <ol className="hd-workspace__breadcrumb" aria-label={`${workspaceTitle} context`}>
              <li>{workspaceTitle}</li>
              {workspaceBreadcrumb.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}
            </ol>
          </div>
          <div className="hd-workspace__header-actions">
              {!programPlanOpen && !liveIppPreviewContext && !isSecuritySettings ? (
              <button
                ref={filterTriggerRef}
                type="button"
                className="hd-workspace__filter-trigger"
                aria-controls={isScreenersDashboard ? 'student-screeners-filter-rail' : isProgramPlansDashboard ? 'student-program-plans-filter-rail' : isAnalyticsOverview ? 'analytics-overview-filter-rail' : 'class-assignment-filter-rail'}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal aria-hidden="true" />
                <span>Filters</span>
                <strong aria-label={`${activeFilterCount} filters selected`}>{activeFilterCount}</strong>
              </button>
            ) : null}
            <span className="hd-workspace__role-context">{user.isDeveloper ? 'Simulated: ' : ''}{formatRoleLabel(effectiveRole)}</span>
            {user.isDeveloper ? (
              <button
                type="button"
                className="hd-workspace__development-trigger"
                aria-label="Open development controls"
                title="Development controls"
                aria-expanded={developmentRailOpen}
                onClick={() => setDevelopmentRailOpen((open) => !open)}
              >
                <Wrench aria-hidden="true" />
              </button>
            ) : null}
            <span className="hd-workspace__environment">Local preview</span>
            <a className="hd-workspace__signout" href={shellSignOutHref}>Sign out</a>
          </div>
        </header>

        {user.isDeveloper ? (
          <>
            <button
              type="button"
              className={developmentRailOpen ? 'hd-development-rail__backdrop is-open' : 'hd-development-rail__backdrop'}
              aria-label="Close development controls"
              tabIndex={developmentRailOpen ? 0 : -1}
              onClick={closeDevelopmentRail}
            />
            <aside className={developmentRailOpen ? 'hd-development-rail is-open' : 'hd-development-rail'} aria-label="Development controls" aria-hidden={!developmentRailOpen}>
              <header className="hd-filter-rail__header">
                <div><span>Data administration</span><h2>Development Controls</h2></div>
                <button type="button" aria-label="Close development controls and clear simulated user" onClick={closeDevelopmentRail}><X aria-hidden="true" /></button>
              </header>
              <div className="hd-development-rail__body">
                <p>These controls affect this local preview only. User preview changes the Dataverse application scope; Fabric RLS continues to evaluate your signed-in identity.</p>
                <form
                  className="hd-development-rail__user"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void onDevelopmentUserChange(developmentUserEmail)
                  }}
                >
                  <label>
                    <span>Preview as user</span>
                    <input
                      type="email"
                      value={developmentUserEmail}
                      placeholder="user@fvsd.ab.ca"
                      autoComplete="off"
                      disabled={developmentUserChanging}
                      required
                      onChange={(event) => setDevelopmentUserEmail(event.target.value)}
                    />
                  </label>
                  {user.activeDevelopmentUserEmail ? <small>Currently previewing {user.activeDevelopmentUserEmail}</small> : <small>Uses the user’s Dataverse role, schools, sections, and student scope.</small>}
                  <div>
                    <button type="submit" disabled={developmentUserChanging || !developmentUserEmail.trim()}>{developmentUserChanging ? 'Applying…' : 'Apply user'}</button>
                    <button type="button" className="is-clear" disabled={developmentUserChanging || (!user.activeDevelopmentUserEmail && !user.activeDevelopmentRole && !developmentUserEmail)} onClick={closeDevelopmentRail}>Clear &amp; close</button>
                  </div>
                </form>
                <label>
                  <span>{user.activeDevelopmentUserEmail ? 'User role' : 'Simulated role'}</span>
                  {user.activeDevelopmentUserEmail ? (
                    <input value={formatRoleLabel(effectiveRole)} disabled readOnly />
                  ) : (
                    <select value={user.activeDevelopmentRole ?? accessContext.effectiveRole} disabled={roleChanging !== null} onChange={(event) => onRoleChange(event.target.value)}>
                      {user.availableDevelopmentRoles.map((role) => <option value={role} key={role}>{formatRoleLabel(role)}</option>)}
                    </select>
                  )}
                </label>
                <div className="hd-development-rail__scope">
                  <span>Preview scope</span>
                  <strong>{roleScopeDefinitions.find((definition) => definition.role === formatRoleLabel(effectiveRole))?.scope ?? 'Governed role scope'}</strong>
                </div>
                <div className="hd-development-rail__student-mode" role="group" aria-label="Student data display mode">
                  <span>Student data</span>
                  <div>
                    <button type="button" className={studentDisplayMode === 'real' ? 'is-active' : undefined} aria-pressed={studentDisplayMode === 'real'} onClick={() => onStudentDisplayModeChange('real')}>Real</button>
                    <button type="button" className={studentDisplayMode === 'obfuscated' ? 'is-active' : undefined} aria-pressed={studentDisplayMode === 'obfuscated'} onClick={() => onStudentDisplayModeChange('obfuscated')}>Obfuscated</button>
                  </div>
                  <small>{studentDisplayMode === 'real' ? 'Student names and ASNs are visible.' : 'Student names and ASNs are masked in the preview.'}</small>
                </div>
                {roleChangeError ? <p className="hd-development-rail__error" role="alert">{roleChangeError}</p> : null}
                {developmentUserError ? <p className="hd-development-rail__error" role="alert">{developmentUserError}</p> : null}
              </div>
            </aside>
          </>
        ) : null}

        {isSecuritySettings ? (
          <SecurityAccessView user={user} accessContext={accessContext} fabricConnection={fabricConnection} copilotAccess={copilotAccess} effectiveRole={effectiveRole} studentDisplayMode={studentDisplayMode} />
        ) : programPlanOpen && selectedStudent ? (
          <section className="hd-program-plan-workspace" data-rail={planRail ?? 'closed'} aria-label="Student Program Plan workspace">
            <div className="hd-program-plan-workspace__main">
              <header className="hd-program-plan__context">
                <button
                  type="button"
                  onClick={() => {
                    setProgramPlanOpen(false)
                    setPlanRail(null)
                    setFiltersOpen(true)
                  }}
                >
                  <ChevronLeft aria-hidden="true" /> Class Assignment
                </button>
                <div>
                  <span>Student Program Plan</span>
                  <h1>{selectedStudent.name}</h1>
                  <p>{selectedStudent.grade} · {schoolFilter || 'Fort Vermilion School Division'}</p>
                </div>
                <strong>2026 / 2027 · Annual Plan</strong>
              </header>

              <section className="hd-program-plan__switcher" aria-labelledby="program-plan-sections-heading">
                <header>
                  <div>
                    <span>Plan sections</span>
                    <h2 id="program-plan-sections-heading">{visiblePlanModules.length} modules in this plan</h2>
                  </div>
                  <div className="hd-program-plan__tools">
                    <button
                      type="button"
                      className={planRail === 'modules' ? 'is-active' : undefined}
                      aria-expanded={planRail === 'modules'}
                      onClick={() => setPlanRail((current) => current === 'modules' ? null : 'modules')}
                    >
                      <PanelsTopLeft aria-hidden="true" /> Module Builder
                    </button>
                    <button
                      type="button"
                      className={planRail === 'exports' ? 'is-active' : undefined}
                      aria-expanded={planRail === 'exports'}
                      onClick={() => setPlanRail((current) => current === 'exports' ? null : 'exports')}
                    >
                      <Files aria-hidden="true" /> Exported Documents
                    </button>
                  </div>
                </header>
                <nav aria-label="Student Program Plan sections">
                  {visiblePlanModules.map((module) => (
                    <button
                      type="button"
                      key={module.name}
                      className={activePlanModule === module.name ? 'is-active' : undefined}
                      aria-current={activePlanModule === module.name ? 'page' : undefined}
                      onClick={() => setActivePlanModule(module.name)}
                    >
                      {module.locked ? <LockKeyhole aria-hidden="true" /> : null}
                      <span>{module.name}</span>
                    </button>
                  ))}
                </nav>
              </section>

              <section className="hd-program-plan__document" aria-labelledby="active-program-plan-module">
                <header>
                  <span className="hd-program-plan__document-icon"><GraduationCap aria-hidden="true" /></span>
                  <div>
                    <span>Student Program Plan section</span>
                    <h2 id="active-program-plan-module">{activePlanModule}</h2>
                  </div>
                  {programPlanModules.find((module) => module.name === activePlanModule)?.locked ? (
                    <strong><LockKeyhole aria-hidden="true" /> Locked in plan</strong>
                  ) : null}
                </header>
                <div className="hd-program-plan__document-body">
                  <p>{programPlanDescriptions[activePlanModule]}</p>

                  {activePlanModule === 'Student Details' ? (
                    <>
                      <dl className="hd-program-plan__student-details">
                        <div><dt>Student name</dt><dd>{selectedStudent.name}</dd></div>
                        <div><dt>ASN</dt><dd>{selectedStudent.asn}</dd></div>
                        <div><dt>Student grade</dt><dd>{selectedStudent.grade}</dd></div>
                        <div><dt>School</dt><dd>{schoolFilter || 'Fort Vermilion School Division'}</dd></div>
                        <div><dt>School year</dt><dd>2026 / 2027</dd></div>
                        <div><dt>Course</dt><dd>{selectedClass?.course.name ?? 'Foundations'}</dd></div>
                        <div><dt>Teacher</dt><dd>{selectedClass?.teacher.name ?? 'Natalie Morris'}</dd></div>
                        <div><dt>Principal</dt><dd>Mike McMann</dd></div>
                      </dl>
                      <section className="hd-program-plan__attendance">
                        <h3>Attendance</h3>
                        <div><span><strong>Fall</strong>—</span><span><strong>Winter</strong>—</span><span><strong>Spring</strong>—</span></div>
                      </section>
                      <small className="hd-program-plan__updated">Last updated: November 12, 2026</small>
                    </>
                  ) : activePlanModule === 'Screener Results' ? (
                    <div className="hd-program-plan__screener-results">
                      <div><strong>Assessment</strong><strong>Fall</strong><strong>Winter</strong><strong>Spring</strong></div>
                      <div><span>TOSREC</span><span>95 · Average</span><span>—</span><span>—</span></div>
                      <div><span>TOWRE</span><span>89 · Below Average</span><span>—</span><span>—</span></div>
                      <div><span>WRAT-5</span><span>92 · Average</span><span>—</span><span>—</span></div>
                    </div>
                  ) : (
                    <section className="hd-program-plan__output-section">
                      <h3>{activePlanModule}</h3>
                      <p>{programPlanDescriptions[activePlanModule]} This is the presentation used in the working plan and carried directly into the exported document.</p>
                      <div>
                        <span>Current plan information</span>
                        <strong>Governed section content will render here from its Dataverse source records.</strong>
                      </div>
                    </section>
                  )}
                </div>
              </section>
            </div>

            {planRail ? (
              <aside className={planRail === 'exports' ? 'hd-program-plan-rail is-exports' : 'hd-program-plan-rail'} aria-label={planRail === 'modules' ? 'Module Builder' : 'Exported Documents'}>
                <header>
                  <div>
                    <span>{planRail === 'modules' ? 'Plan structure' : 'Annual plan files'}</span>
                    <h2>{planRail === 'modules' ? 'Module Builder' : 'Exported Documents'}</h2>
                  </div>
                  <div className="hd-program-plan-rail__header-actions">
                    {planRail === 'exports' ? (
                      <button type="button" className="hd-program-plan-rail__request"><FileCheck2 aria-hidden="true" /> Request export</button>
                    ) : null}
                    <button
                      type="button"
                      className="hd-program-plan-rail__close"
                      aria-label={`Close ${planRail === 'modules' ? 'Module Builder' : 'Exported Documents'}`}
                      onClick={() => setPlanRail(null)}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </header>
                {planRail === 'modules' ? (
                  <>
                    <div className="hd-program-plan-rail__controls">
                      <div><strong>Choose plan modules</strong><span>Required modules remain locked in the annual plan.</span></div>
                      <label><input type="checkbox" checked={showModuleDescriptions} onChange={(event) => setShowModuleDescriptions(event.target.checked)} /> Show full descriptions</label>
                    </div>
                    <div className="hd-program-plan-rail__body hd-program-plan-rail__modules">
                      {programPlanModuleGroups.map((group) => (
                        <section className="hd-program-plan-rail__module-group" key={group} aria-labelledby={`program-plan-module-group-${group.replaceAll(' ', '-').toLowerCase()}`}>
                          <h3 id={`program-plan-module-group-${group.replaceAll(' ', '-').toLowerCase()}`}>{group}</h3>
                          {programPlanModules.filter((module) => module.group === group).map((module) => {
                            const included = includedPlanModules.has(module.name)
                            const includedInExport = exportedPlanModules.has(module.name)
                            const notesAfterSection = notesAfterPlanSections.has(module.name)
                            return (
                              <article className={included ? undefined : 'is-available'} key={module.name}>
                                <div className="hd-program-plan-rail__module-summary">
                                  <strong>{module.name}</strong>
                                  {module.locked ? <span><LockKeyhole aria-hidden="true" /> Locked</span> : <span>{included ? 'Included' : 'Available'}</span>}
                                </div>
                                {showModuleDescriptions ? <p>{programPlanDescriptions[module.name]}</p> : null}
                                <div className="hd-program-plan-rail__module-actions">
                                  {included ? (
                                    <button
                                      type="button"
                                      className={includedInExport ? 'is-positive' : 'is-negative'}
                                      aria-label={`${includedInExport ? 'Exclude' : 'Include'} ${module.name} ${includedInExport ? 'from' : 'in'} exported document`}
                                      title={includedInExport ? 'Included in exported document' : 'Excluded from exported document'}
                                      onClick={() => toggleSetValue(setExportedPlanModules, module.name)}
                                    >
                                      {includedInExport ? <FileCheck2 aria-hidden="true" /> : <FileX2 aria-hidden="true" />}
                                    </button>
                                  ) : null}
                                  {included && module.notes ? (
                                    <button
                                      type="button"
                                      className={notesAfterSection ? 'is-positive' : 'is-negative'}
                                      aria-label={notesAfterSection
                                        ? `Move ${module.name} notes to Teacher Comment and Next Steps`
                                        : `Print ${module.name} notes after this section`}
                                      title={notesAfterSection ? 'Notes print after this section' : 'Notes print within Teacher Comment and Next Steps'}
                                      onClick={() => toggleSetValue(setNotesAfterPlanSections, module.name)}
                                    >
                                      <NotebookPen aria-hidden="true" />
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="hd-program-plan-rail__membership"
                                    disabled={module.locked}
                                    onClick={() => togglePlanModule(module.name)}
                                  >
                                    {module.locked ? <LockKeyhole aria-hidden="true" /> : included ? <Trash2 aria-hidden="true" /> : <Plus aria-hidden="true" />}
                                    {module.locked ? 'Required' : included ? 'Remove' : 'Add'}
                                  </button>
                                </div>
                              </article>
                            )
                          })}
                        </section>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hd-program-plan-rail__body hd-program-plan-rail__exports">
                      <button type="button">
                        <FileText aria-hidden="true" />
                        <span><strong>{selectedStudent.name} – Student Program Plan (Nov 12, 2026).pdf</strong><small>Exported November 12, 2026 · PDF document</small></span>
                        <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </aside>
            ) : null}
          </section>
        ) : isScreenersDashboard ? (
          <StudentScreenersDashboard
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            effectiveRole={effectiveRole}
            studentDisplayMode={studentDisplayMode}
            onContextChange={setLiveScreenersContext}
          />
        ) : isProgramPlansDashboard && liveIppPreviewContext ? (
          <IppPreview context={liveIppPreviewContext} onBackToClassAssignment={() => setLiveIppPreviewContext(null)} />
        ) : isProgramPlansDashboard ? (
          <StudentProgramPlansDashboard
            key={`${effectiveRole}:${user.activeDevelopmentUserEmail ?? user.email ?? ''}`}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            effectiveRole={effectiveRole}
            scopeKey={user.activeDevelopmentUserEmail ?? user.email ?? ''}
            currentSchoolYear={user.currentSchoolYear}
            studentDisplayMode={studentDisplayMode}
            onContextChange={setLiveProgramPlansContext}
            onOpenIpp={setLiveIppPreviewContext}
          />
        ) : isAnalyticsOverview ? (
          <div className="hd-class-assignment hd-analytics-layout" data-filters={filtersOpen ? 'open' : 'closed'}>
            <aside className="hd-filter-rail" id="analytics-overview-filter-rail" aria-label="Analytics Overview filters">
              <header className="hd-filter-rail__header">
                <div><span>Analytics Overview</span><h2>Filters</h2></div>
                <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
              </header>
              <form className="hd-filter-rail__body">
                <label>
                  <span>School Year</span>
                  <select value={analyticsSchoolYear} onChange={(event) => setAnalyticsSchoolYear(event.target.value)}>
                    <option>2026 / 2027</option><option>2025 / 2026</option><option>2024 / 2025</option>
                  </select>
                </label>
                <label>
                  <span>Period</span>
                  <select value={analyticsPeriod} onChange={(event) => setAnalyticsPeriod(event.target.value)}>
                    <option>All periods</option><option>Fall</option><option>Winter</option><option>Spring</option>
                  </select>
                </label>
                <label>
                  <span>School</span>
                  <select value={analyticsSchool} onChange={(event) => setAnalyticsSchool(event.target.value)}>
                    <option>All permitted schools</option><option>Blue Hills Community School</option><option>Buffalo Head Prairie School</option><option>Florence MacDougall Community School</option><option>Sand Hills Elementary School</option>
                  </select>
                </label>
                <label>
                  <span>Grade</span>
                  <select value={analyticsGrade} onChange={(event) => setAnalyticsGrade(event.target.value)}>
                    <option>All grades</option><option>Grade 2</option><option>Grade 3</option><option>Grade 4</option><option>Grade 5</option><option>Grade 6</option><option>Grade 7</option><option>Grade 8</option><option>Grade 9</option>
                  </select>
                </label>
                <div className="hd-filter-rail__history">
                  <span className="hd-filter-rail__history-title">Analysis focus</span>
                  <label>
                    <span>Focus Area</span>
                    <select value={analyticsFocus} onChange={(event) => setAnalyticsFocus(event.target.value as AnalyticsFocus)}>
                      <option>Literacy</option><option>Numeracy</option><option disabled>Wellbeing</option>
                    </select>
                  </label>
                  <label>
                    <span>Assessment Group</span>
                    <select value={analyticsAssessment} onChange={(event) => setAnalyticsAssessment(event.target.value)}>
                      <option>TOSREC</option><option>TOWRE</option><option>WRAT-5</option><option>PNSA</option>
                    </select>
                  </label>
                </div>
              </form>
              <footer className="hd-filter-rail__footer">
                <button type="button" onClick={() => {
                  setAnalyticsSchoolYear('2026 / 2027')
                  setAnalyticsPeriod('All periods')
                  setAnalyticsSchool('All permitted schools')
                  setAnalyticsGrade('All grades')
                  setAnalyticsFocus('Literacy')
                  setAnalyticsAssessment('TOSREC')
                }}>
                  <RotateCcw aria-hidden="true" /><span>Reset filters</span>
                </button>
              </footer>
            </aside>

            <section className="hd-analytics-dashboard" aria-labelledby="analytics-overview-heading">
              <header className="hd-screeners-dashboard__heading">
                <div>
                  <span>Main area of focus</span>
                  <h1 id="analytics-overview-heading">{analyticsFocus} overview</h1>
                  <p>Move from division-level achievement signals to the schools, periods, and cohort groups that need attention.</p>
                </div>
                <div className="hd-screeners-dashboard__heading-actions">
                  <span>{analyticsAssessment} · {analyticsSchoolYear}</span>
                  <button type="button"><RefreshCw aria-hidden="true" /> Refresh</button>
                </div>
              </header>

              <div className="hd-analytics-dashboard__body">
                <section className="hd-screeners-summary hd-analytics-signals" aria-label="Executive analytics signals">
                  <article className="is-term-4"><span>Median score</span><strong>94</strong><small>{analyticsAssessment} · Fall · Average</small><BarChart3 aria-hidden="true" /></article>
                  <article className="is-complete"><span>Participation</span><strong>2,210</strong><small>Governed submissions represented</small><UsersRound aria-hidden="true" /></article>
                  <article><span>School coverage</span><strong>12</strong><small>Permitted schools represented</small><School aria-hidden="true" /></article>
                  <article className="is-missing"><span>Needs attention</span><strong>3</strong><small>School and cohort signals</small><Target aria-hidden="true" /></article>
                </section>

                <div className="hd-analytics-dashboard__columns">
                  <section className="hd-analytics-trends" aria-labelledby="analytics-trends-heading">
                    <header><div><span>Period trend</span><h2 id="analytics-trends-heading">Median score by instructional context</h2></div><small>Standard score</small></header>
                    <div className="hd-analytics-trends__chart">
                      {([
                        ['Fall', 76, 96],
                        ['Winter', 82, 101],
                        ['Spring', 86, 104],
                      ] as const).map(([period, foundation, curriculum]) => (
                        <div key={period}>
                          <div className="hd-analytics-trends__bars">
                            <span
                              className={`is-level-${getScreenerTerm(foundation).level}`}
                              style={{ blockSize: `${foundation * .72}%` }}
                              title={`Foundation: ${foundation} · ${getScreenerTerm(foundation).label}`}
                            ><i>{foundation}</i></span>
                            <span
                              className={`is-level-${getScreenerTerm(curriculum).level}`}
                              style={{ blockSize: `${curriculum * .72}%` }}
                              title={`Curriculum: ${curriculum} · ${getScreenerTerm(curriculum).label}`}
                            ><i>{curriculum}</i></span>
                          </div>
                          <strong>{period}</strong>
                          <small>Foundation · Curriculum</small>
                        </div>
                      ))}
                    </div>
                    <footer aria-label="Screener descriptive term legend">
                      {screenerTermScale.map((term) => (
                        <span key={term.level} className={`hd-analytics-term-chip is-level-${term.level}`}>{term.label}</span>
                      ))}
                    </footer>
                  </section>

                  <section className="hd-analytics-attention" aria-labelledby="analytics-attention-heading">
                    <header><div><span>Executive signals</span><h2 id="analytics-attention-heading">What needs our attention?</h2></div><strong>3 signals</strong></header>
                    <div>
                      <article><span><BarChart3 aria-hidden="true" /></span><div><strong>Performance</strong><small>Foundation cohorts trail curriculum cohorts by 18 median-score points.</small></div><ChevronRight aria-hidden="true" /></article>
                      <article><span className="is-positive"><UsersRound aria-hidden="true" /></span><div><strong>Participation</strong><small>2,210 governed {analyticsAssessment} submissions are represented in the current view.</small></div><ChevronRight aria-hidden="true" /></article>
                      <article><span className="is-attention"><Target aria-hidden="true" /></span><div><strong>Focus</strong><small>Three school or grade cohorts are below the current comparison threshold.</small></div><ChevronRight aria-hidden="true" /></article>
                    </div>
                  </section>
                </div>

                <section className="hd-analytics-comparison" aria-labelledby="analytics-comparison-heading">
                  <header>
                    <div><span>School comparison</span><h2 id="analytics-comparison-heading">Median score by period and cohort group</h2><p>School years and grades remain vertical; periods and comparable cohort groups remain fixed.</p></div>
                    <button type="button">View focused cohort <ChevronRight aria-hidden="true" /></button>
                  </header>
                  <div className="hd-analytics-comparison__table-wrap">
                    <table>
                      <thead>
                        <tr><th rowSpan={2}>School / Grade</th><th colSpan={2}>Fall</th><th colSpan={2}>Winter</th><th colSpan={2}>Spring</th></tr>
                        <tr><th>Foundation</th><th>Curriculum</th><th>Foundation</th><th>Curriculum</th><th>Foundation</th><th>Curriculum</th></tr>
                      </thead>
                      {analyticsComparisonGroups.map(([school, rows]) => {
                        const isCollapsed = collapsedAnalyticsSchools.has(school)
                        return (
                          <tbody key={school} className={isCollapsed ? 'is-collapsed' : undefined}>
                            <tr className="hd-analytics-school-group">
                              <th colSpan={7}>
                                <button
                                  type="button"
                                  aria-expanded={!isCollapsed}
                                  onClick={() => toggleSetValue(setCollapsedAnalyticsSchools, school)}
                                >
                                  {isCollapsed ? <ChevronRight aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                                  <span><strong>{school}</strong><small>{rows.length} grade cohort{rows.length === 1 ? '' : 's'}</small></span>
                                </button>
                              </th>
                            </tr>
                            {!isCollapsed && rows.map((row) => (
                              <tr key={`${row.school}-${row.grade}`} className="hd-analytics-grade-row">
                                <th><span>{row.grade}</span></th>
                                {[row.fallFoundation, row.fallCurriculum, row.winterFoundation, row.winterCurriculum, row.springFoundation, row.springCurriculum].map((score, scoreIndex) => {
                                  const term = getScreenerTerm(score)
                                  return <td key={scoreIndex}><span className={`hd-analytics-score-chip is-level-${term.level}`} title={term.label}>{score}</span></td>
                                })}
                              </tr>
                            ))}
                          </tbody>
                        )
                      })}
                    </table>
                  </div>
                </section>
              </div>
            </section>
          </div>
            ) : activeItem === 'class-assignments' ? (
              liveIppPreviewContext ? (
                <IppPreview
                  context={liveIppPreviewContext}
                  onBackToClassAssignment={() => setLiveIppPreviewContext(null)}
                />
              ) : (
                <ClassAssignmentWorkspaceV2
                  filtersOpen={filtersOpen}
                  setFiltersOpen={setFiltersOpen}
                  onContextChange={setLiveClassAssignmentContext}
                  studentDisplayMode={studentDisplayMode}
                  currentSchoolYear={user.currentSchoolYear}
                  onOpenIpp={setLiveIppPreviewContext}
                />
              )
        ) : (
        <div className="hd-class-assignment" data-filters={filtersOpen ? 'open' : 'closed'}>
          <aside className="hd-filter-rail" id="class-assignment-filter-rail" aria-label="Class Assignment filters">
            <header className="hd-filter-rail__header">
              <div>
                <span>Class Assignment</span>
                <h2>Filters</h2>
              </div>
              <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
            </header>
            <form className="hd-filter-rail__body">
              <label>
                <span>School</span>
                <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                  <option value="">All schools</option>
                  <option>Florence MacDougall Community School</option>
                </select>
              </label>
              <label>
                <span>Section Group</span>
                <select
                  value={sectionGroupFilter}
                  onChange={(event) => {
                    setSectionGroupFilter(event.target.value)
                    setCourseFilter('')
                    setTeacherFilter('')
                    setStudentFilter('')
                    setHistoryView('assessment')
                    setAssessmentTypeFilter('')
                    setHistoryPeriod('current')
                    setSelectedClass(null)
                  }}
                >
                  <option value="">All section groups</option>
                  <option>Literacy</option><option>Numeracy</option><option>Foundations</option><option>Homeroom</option>
                </select>
              </label>
              <label>
                <span>Course Name</span>
                <select
                  value={courseFilter}
                  onChange={(event) => {
                    setCourseFilter(event.target.value)
                    setTeacherFilter('')
                    setStudentFilter('')
                    setHistoryView('assessment')
                    setAssessmentTypeFilter('')
                    setHistoryPeriod('current')
                    setSelectedClass(null)
                  }}
                >
                  <option value="">All course names</option>
                  {availableSections.map((course) => <option key={course.code}>{course.name}</option>)}
                </select>
              </label>
              <label>
                <span>Teacher</span>
                <select
                  value={teacherFilter}
                  onChange={(event) => {
                    const teacherName = event.target.value
                    setTeacherFilter(teacherName)
                    setStudentFilter('')
                    setHistoryView('assessment')
                    setAssessmentTypeFilter('')
                    setHistoryPeriod('current')
                    if (!teacherName) {
                      setSelectedClass(null)
                      return
                    }
                    const course = availableSections.find((item) => item.teachers.some((teacher) => teacher.name === teacherName))
                    const teacher = course?.teachers.find((item) => item.name === teacherName)
                    if (course && teacher) {
                      setCourseFilter(course.name)
                      setSelectedClass({ course, teacher })
                    }
                  }}
                >
                  <option value="">All teachers</option>
                  {availableSections.flatMap((course) => course.teachers).map((teacher) => <option key={teacher.name}>{teacher.name}</option>)}
                </select>
              </label>
              {selectedClass ? (
                <label>
                  <span>Student</span>
                  <select
                    value={studentFilter}
                    onChange={(event) => {
                      setStudentFilter(event.target.value)
                      setHistoryView('assessment')
                      setAssessmentTypeFilter('')
                      setHistoryPeriod('current')
                    }}
                  >
                    <option value="">All students</option>
                    {studentRoster.map((student) => <option key={student.asn}>{student.name}</option>)}
                  </select>
                </label>
              ) : null}
              {selectedStudent ? (
                <div className="hd-filter-rail__history">
                  <span className="hd-filter-rail__history-title">History filters</span>
                  {supportsProgramPlans ? (
                    <label>
                      <span>History View</span>
                      <select
                        value={historyView}
                        onChange={(event) => {
                          setHistoryView(event.target.value as HistoryView)
                          setAssessmentTypeFilter('')
                        }}
                      >
                        <option value="assessment">Assessment History</option>
                        <option value="program-plan">Student Program Plan History</option>
                      </select>
                    </label>
                  ) : null}
                  <label>
                    <span>School Years</span>
                    <select value={historyPeriod} onChange={(event) => setHistoryPeriod(event.target.value as 'current' | 'previous')}>
                      <option value="current">Current Year</option>
                      <option value="previous">Previous Years</option>
                    </select>
                  </label>
                  {historyView === 'assessment' ? (
                    <label>
                      <span>Assessment Type</span>
                      <select value={assessmentTypeFilter} onChange={(event) => setAssessmentTypeFilter(event.target.value)}>
                        <option value="">All assessment types</option>
                        {historyAssessmentGroups.map((assessmentType) => <option key={assessmentType}>{assessmentType}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </form>
            <footer className="hd-filter-rail__footer">
              <button
                type="button"
                onClick={() => {
                  setSchoolFilter('')
                  setSectionGroupFilter('')
                  setCourseFilter('')
                  setTeacherFilter('')
                  setStudentFilter('')
                  setHistoryView('assessment')
                  setHistoryPeriod('current')
                  setAssessmentTypeFilter('')
                  setSelectedClass(null)
                }}
              >
                <RotateCcw aria-hidden="true" /><span>Reset filters</span>
              </button>
            </footer>
          </aside>

          <section className="hd-class-sections" aria-labelledby="teacher-sections-title">
            <header className="hd-class-sections__heading">
              <div>
                <span>{selectedClass ? 'Assigned students' : 'Available teacher sections'}</span>
                <h1 id="teacher-sections-title">
                  {selectedClass ? `${selectedClass.course.name} · ${selectedClass.teacher.name}` : `${sectionGroupFilter || 'Teacher'} Sections`}
                </h1>
                <p>{selectedClass ? (selectedStudent ? `${selectedStudent.name} selected for student history.` : `${selectedClass.teacher.students} assigned students loaded from Dataverse.`) : 'Select a teacher section to load its current student roster.'}</p>
              </div>
              <span className="hd-class-sections__count">
                <UsersRound aria-hidden="true" />
                {selectedClass ? (selectedStudent ? '1 student' : `${selectedClass.teacher.students} students`) : `${availableSectionCount} sections`}
              </span>
            </header>
            <div className="hd-class-sections__body">
              {selectedClass ? (
                <>
                  <article className="hd-course-section hd-selected-course">
                    <header>
                      <GraduationCap aria-hidden="true" />
                      <div><h2>{selectedClass.course.name}</h2><span>{sectionGroupFilter || 'Section'} · {selectedClass.course.code}</span></div>
                    </header>
                    <div className="hd-selected-course__body">
                      <div className="hd-selected-course__teacher">
                        <span className="hd-teacher-card__icon"><UsersRound aria-hidden="true" /></span>
                        <span className="hd-teacher-card__copy"><strong>{selectedClass.teacher.name}</strong><small>{selectedClass.teacher.students} students</small></span>
                      </div>
                      {selectedStudent ? (
                        <div className="hd-selected-course__student">
                          <span><strong>{selectedStudent.name}</strong><small>{selectedStudent.grade}</small></span>
                          <span><small>ASN</small><strong>{selectedStudent.asn}</strong></span>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="hd-selected-course__back"
                        onClick={() => selectedStudent ? setStudentFilter('') : closeClass()}
                      >
                        <ChevronLeft aria-hidden="true" /> {selectedStudent ? 'Back to student list' : 'Back to sections'}
                      </button>
                    </div>
                  </article>

                  {selectedStudent ? historyView === 'program-plan' && supportsProgramPlans ? (
                    <section className="hd-student-history" aria-labelledby="student-program-plan-history-heading">
                      <header>
                        <div>
                          <span>Student Program Plan</span>
                          <h2 id="student-program-plan-history-heading">Student Program Plan History</h2>
                          <p>One governed Student Program Plan is maintained for each student and school year.</p>
                        </div>
                        {historyPeriod === 'current' && !hasCurrentProgramPlan ? (
                          <button type="button">
                            <Plus aria-hidden="true" /> Add Program Plan
                          </button>
                        ) : null}
                      </header>
                      <div className="hd-student-history__groups">
                        <section className="hd-history-group" aria-label="Student Program Plan records">
                          <header><strong>Student Program Plan</strong><span>{historyPeriod === 'current' && hasCurrentProgramPlan ? '1 record' : '0 records'}</span></header>
                          {historyPeriod === 'current' && hasCurrentProgramPlan ? (
                            <div className="hd-history-record hd-program-plan-record">
                              <span><small>Plan</small><strong>Student Program Plan</strong></span>
                              <span><small>School year</small><strong>2026 / 2027</strong></span>
                              <span><small>Grade</small><strong>{selectedStudent.grade}</strong></span>
                              <span><small>School</small><strong>{schoolFilter || 'Fort Vermilion School Division'}</strong></span>
                              <span><small>Last updated</small><strong>Nov 12, 2026</strong></span>
                              <div className="hd-history-record__actions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProgramPlanOpen(true)
                                    setActivePlanModule('Student Details')
                                    setPlanRail(null)
                                    setFiltersOpen(false)
                                  }}
                                >
                                  <Eye aria-hidden="true" />Open
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="hd-history-empty">
                              <GraduationCap aria-hidden="true" />
                              <div>
                                <strong>Student Program Plan history</strong>
                                <span>
                                  {historyPeriod === 'current'
                                    ? 'No Student Program Plan has been created for 2026 / 2027.'
                                    : 'No Student Program Plan records were found for previous years.'}
                                </span>
                              </div>
                            </div>
                          )}
                        </section>
                      </div>
                    </section>
                  ) : (
                    <section className="hd-student-history" aria-labelledby="student-assessment-history-heading">
                      <header>
                        <div>
                          <span>Student Assessment History</span>
                          <h2 id="student-assessment-history-heading">Assessment History</h2>
                          <p>Assessment history is grouped by assessment type and focus area.</p>
                        </div>
                        {canAddAssessment ? (
                          <button
                            type="button"
                            onClick={() => setAssessmentModal({
                              mode: 'create',
                              assessmentType: assessmentTypeFilter || historyAssessmentGroups[0] || 'TOSREC',
                            })}
                          >
                            <Plus aria-hidden="true" /> Add assessment
                          </button>
                        ) : null}
                      </header>
                      <div className="hd-student-history__groups">
                        {visibleHistoryAssessmentGroups.map((assessmentType) => {
                          const record = historyPeriod === 'current' ? assessmentHistoryPreview[assessmentType] : undefined
                          return (
                            <section className="hd-history-group" aria-label={`${assessmentType} assessment records`} key={assessmentType}>
                              <header><strong>{assessmentType}</strong><span>{record ? '1 record' : '0 records'}</span></header>
                              {record ? (
                                <div className="hd-history-record">
                                  <span><small>School year</small><strong>{record.schoolYear}</strong></span>
                                  <span><small>Period</small><strong>{record.period}</strong></span>
                                  <span><small>Standard score</small><strong>{record.standardScore}</strong></span>
                                  <span><small>Descriptive term</small><strong className={`hd-history-record__term is-level-${record.termLevel}`}>{record.descriptiveTerm}</strong></span>
                                  <div className="hd-history-record__actions">
                                    <button type="button" onClick={() => setAssessmentModal({ mode: 'view', assessmentType })}><Eye aria-hidden="true" />View</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="hd-history-empty">
                                  <BookOpenText aria-hidden="true" />
                                  <div>
                                    <strong>Assessment history</strong>
                                    <span>No {assessmentType} records were found for {historyPeriod === 'current' ? '2026 / 2027' : 'previous years'}.</span>
                                  </div>
                                </div>
                              )}
                            </section>
                          )
                        })}
                      </div>
                    </section>
                  ) : (
                    <section className="hd-student-roster" aria-label="Assigned students">
                      <div className="hd-student-grid">
                        {visibleStudents.map((student) => (
                          <button
                            type="button"
                            className={studentFilter === student.name ? 'hd-student-card is-selected' : 'hd-student-card'}
                            key={student.asn}
                            onClick={() => {
                              setStudentFilter(student.name)
                              setHistoryView('assessment')
                              setAssessmentTypeFilter('')
                              setHistoryPeriod('current')
                            }}
                          >
                            <span className="hd-student-card__heading"><strong>{student.name}</strong><small>{student.grade}</small></span>
                            <span className="hd-student-card__details">
                              <span><small>ASN</small><strong>{student.asn}</strong></span>
                              <span><small>Date of birth</small><strong>{student.dateOfBirth}</strong></span>
                              <span><small>Gender</small><strong>{student.gender}</strong></span>
                              <span><small>SPED</small><strong>{student.sped}</strong></span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : availableSections.map((course) => (
                  <article className="hd-course-section" key={course.code}>
                    <header>
                      <GraduationCap aria-hidden="true" />
                      <div><h2>{course.name}</h2><span>{sectionGroupFilter || 'Section'} · {course.code}</span></div>
                    </header>
                    <div className="hd-teacher-grid">
                      {course.teachers.map((teacher) => (
                        <button type="button" className="hd-teacher-card" key={teacher.name} onClick={() => openClass(course, teacher)}>
                          <span className="hd-teacher-card__icon"><UsersRound aria-hidden="true" /></span>
                          <span className="hd-teacher-card__copy"><strong>{teacher.name}</strong><small>{teacher.students} students</small></span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
        )}
      </main>

      <Dialog
        open={Boolean(assessmentModal)}
        className="hd-assessment-dialog"
        title={assessmentModal ? (
          <>
            <small>Assessment data entry</small>
            <span>{assessmentModal.mode === 'create' ? 'Add Student Assessment' : assessmentModal.mode === 'edit' ? 'Edit Student Assessment' : 'View Student Assessment'}</span>
          </>
        ) : ''}
        description={selectedStudent ? `${selectedStudent.name} · ${selectedStudent.grade}` : undefined}
        onClose={() => setAssessmentModal(null)}
        footer={assessmentModal ? (
          <>
            <span className="hd-assessment-dialog__footer-note">
              {assessmentModal.mode === 'view' ? 'Viewing the saved assessment record.' : 'The assessment is not created or updated until Save is selected.'}
            </span>
            <div className="hd-assessment-dialog__actions">
              <Button variant="secondary" onClick={() => setAssessmentModal(null)}>{assessmentModal.mode === 'view' ? 'Close' : 'Cancel'}</Button>
              {assessmentModal.mode === 'view' ? (
                <>
                  <Button variant="danger" icon={<Trash2 size={16} />}>Delete Assessment</Button>
                  <Button icon={<Pencil size={16} />} onClick={() => setAssessmentModal({ ...assessmentModal, mode: 'edit' })}>Edit</Button>
                </>
              ) : (
                <Button icon={<Save size={16} />} onClick={() => setAssessmentModal(null)}>{assessmentModal.mode === 'create' ? 'Save Assessment' : 'Save Changes'}</Button>
              )}
            </div>
          </>
        ) : undefined}
      >
        {assessmentModal ? (
          <form className="hd-assessment-form" onSubmit={(event) => event.preventDefault()}>
            <section className="hd-assessment-form__type">
              <label>
                <span>Assessment Type</span>
                <select
                  value={assessmentModal.assessmentType}
                  disabled={assessmentModal.mode !== 'create'}
                  onChange={(event) => setAssessmentModal({ ...assessmentModal, assessmentType: event.target.value })}
                >
                  {historyAssessmentGroups.map((assessmentType) => <option key={assessmentType}>{assessmentType}</option>)}
                </select>
                <small>Filtered by student curriculum and grade.</small>
              </label>
            </section>

            <section className="hd-assessment-form__section">
              <header><h3>Assessment Details</h3></header>
              <div className="hd-assessment-form__grid">
                <label>
                  <span>Assessment Date <em>Required</em></span>
                  <input type="date" defaultValue={assessmentModal.mode === 'create' ? '' : '2026-09-18'} disabled={assessmentModal.mode === 'view'} />
                </label>
                <label>
                  <span>Period <em>Required</em></span>
                  <select defaultValue={assessmentModal.mode === 'create' ? '' : 'Fall'} disabled={assessmentModal.mode === 'view'}>
                    <option value="">Select period</option><option>Fall</option><option>Winter</option><option>Spring</option>
                  </select>
                </label>
                <label>
                  <span>Exempt <em>Required</em></span>
                  <select defaultValue={assessmentModal.mode === 'create' ? '' : 'No'} disabled={assessmentModal.mode === 'view'}>
                    <option value="">Select exempt status</option><option>No</option><option>Yes</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="hd-assessment-form__section hd-assessment-form__scoring">
              <header><span>{assessmentModal.assessmentType}</span><h3>Assessment Scoring</h3></header>
              <div className="hd-assessment-form__score-inputs">
                <label>
                  <span>Total Correct <em>Required</em></span>
                  <select defaultValue={assessmentModal.mode === 'create' ? '' : '30'} disabled={assessmentModal.mode === 'view'}>
                    <option value="">Select total correct</option><option>30</option><option>29</option><option>28</option>
                  </select>
                </label>
                <label>
                  <span>Total Error <em>Required</em></span>
                  <select defaultValue={assessmentModal.mode === 'create' ? '' : '7'} disabled={assessmentModal.mode === 'view'}>
                    <option value="">Select total error</option><option>7</option><option>6</option><option>5</option>
                  </select>
                </label>
              </div>
              <div className="hd-assessment-form__results" aria-label="Calculated assessment results">
                <span><small>Raw score</small><strong>{assessmentModal.mode === 'create' ? '—' : '23'}</strong></span>
                <span><small>Standard score</small><strong>{assessmentModal.mode === 'create' ? '—' : '95'}</strong></span>
                <span><small>Percentile rank</small><strong>{assessmentModal.mode === 'create' ? '—' : '37'}</strong></span>
                <span><small>Descriptive term</small><strong className={assessmentModal.mode === 'create' ? undefined : 'is-average'}>{assessmentModal.mode === 'create' ? '—' : 'Average'}</strong></span>
              </div>
            </section>
          </form>
        ) : null}
      </Dialog>
    </div>
  )
}

function SecurityAccessView({ user, accessContext, fabricConnection, copilotAccess, effectiveRole, studentDisplayMode }: {
  user: ShellUser
  accessContext: ShellAccessContext
  fabricConnection: ShellConnectionStatus
  copilotAccess: CopilotAccessStatus | null
  effectiveRole: string
  studentDisplayMode: StudentDisplayMode
}) {
  const [activeView, setActiveView] = useState<'access' | 'copilot'>('access')
  const schools = [accessContext.primarySchool?.name, accessContext.alternativeSchool?.name].filter((value): value is string => Boolean(value))
  const normalizedAssignedRole = formatRoleLabel(accessContext.storedRole || accessContext.effectiveRole)
  const effectiveScope = roleScopeDefinitions.find((definition) => definition.role === formatRoleLabel(effectiveRole))
  return (
    <section className="hd-security-workspace" aria-labelledby="security-access-heading">
      <header className="hd-security-workspace__intro">
        <div>
          <span>{activeView === 'access' ? 'Identity and authorization' : 'Copilot governance'}</span>
          <h1 id="security-access-heading">{activeView === 'access' ? 'Roles & Security' : 'Copilot & cost-based billing'}</h1>
          <p>{activeView === 'access'
            ? 'Review the identity, role, school assignments, and data-security boundaries active for this Nexus session.'
            : 'Review the Copilot experience available to this user and the connection readiness for Work IQ, spending policy, and cost-based billing.'}</p>
        </div>
        <span className="hd-security-workspace__status"><ShieldCheck aria-hidden="true" /> {activeView === 'access' ? 'Governed access verified' : 'Entitlement evaluated'}</span>
      </header>

      <nav className="hd-security-tabs" aria-label="Security and access views">
        <button className={activeView === 'access' ? 'is-active' : undefined} type="button" onClick={() => setActiveView('access')}>
          <ShieldCheck aria-hidden="true" /> Access overview
        </button>
        <button className={activeView === 'copilot' ? 'is-active' : undefined} type="button" onClick={() => setActiveView('copilot')}>
          <Sparkles aria-hidden="true" /> Copilot &amp; cost-based billing
        </button>
      </nav>

      {activeView === 'access' ? <>
        <div className="hd-security-grid">
        <article className="hd-security-card">
          <header><ShieldCheck aria-hidden="true" /><div><span>Microsoft Entra ID</span><h2>Signed-in identity</h2></div></header>
          <dl>
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email ?? accessContext.email}</dd></div>
            <div><dt>Session</dt><dd>Authenticated</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><School aria-hidden="true" /><div><span>Dataverse</span><h2>Governed role assignment</h2></div></header>
          <dl>
            <div><dt>Assigned role</dt><dd>{formatRoleLabel(accessContext.storedRole || accessContext.effectiveRole)}</dd></div>
            <div><dt>Effective role</dt><dd>{formatRoleLabel(accessContext.effectiveRole)}</dd></div>
            <div><dt>Governed scope</dt><dd>{roleScopeDefinitions.find((definition) => definition.role === normalizedAssignedRole)?.scope ?? 'Role-defined data scope'}</dd></div>
            <div><dt>School assignments</dt><dd>{schools.length ? schools.join(' · ') : normalizedAssignedRole === 'Executive' || normalizedAssignedRole === 'Data Administrator' ? 'All permitted schools' : 'No school assignment returned'}</dd></div>
            <div><dt>Continuum administrator</dt><dd>{accessContext.continuumAdministrator ? 'Yes' : 'No'}</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><Database aria-hidden="true" /><div><span>Microsoft Fabric</span><h2>Row-level security</h2></div></header>
          <dl>
            <div><dt>Connection</dt><dd>{fabricConnection.status}</dd></div>
            <div><dt>Semantic model</dt><dd>{fabricConnection.workspace} · {fabricConnection.semanticModel}</dd></div>
            <div><dt>RLS identity</dt><dd>{user.rlsIdentity}</dd></div>
            <div><dt>Evaluation</dt><dd>{user.rlsEvaluation}</dd></div>
            <div><dt>School year</dt><dd>{user.currentSchoolYear}</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><Sparkles aria-hidden="true" /><div><span>Local development</span><h2>Preview controls</h2></div></header>
          <dl>
            <div><dt>Navigation role</dt><dd>{user.isDeveloper ? `Simulated: ${formatRoleLabel(effectiveRole)}` : formatRoleLabel(effectiveRole)}</dd></div>
            <div><dt>Preview scope</dt><dd>{effectiveScope?.scope ?? 'Governed role scope'}</dd></div>
            <div><dt>Student display</dt><dd>{studentDisplayMode === 'real' ? 'Real names and ASNs' : 'Obfuscated names and ASNs'}</dd></div>
            <div><dt>Security effect</dt><dd>{user.isDeveloper ? 'UI role simulation only; Fabric continues to evaluate the signed-in identity.' : 'Governed role and identity are applied.'}</dd></div>
          </dl>
        </article>
        </div>

        <section className="hd-security-scopes" aria-labelledby="security-scope-heading">
        <header>
          <div><span>Authorization model</span><h2 id="security-scope-heading">Governed role scopes</h2><p>Record visibility is resolved from the signed-in identity and the assignment source shown below.</p></div>
          <strong>{roleScopeDefinitions.length} roles</strong>
        </header>
        <div className="hd-security-scopes__list">
          {roleScopeDefinitions.map((definition) => (
            <article className={definition.role === formatRoleLabel(effectiveRole) ? 'is-current' : undefined} key={definition.role}>
              <div><strong>{definition.role}</strong>{definition.role === formatRoleLabel(effectiveRole) ? <span>Current preview</span> : null}</div>
              <p>{definition.scope}</p>
              <small>{definition.source}</small>
              <em className={definition.state === 'active' ? 'is-active' : 'is-planned'}>{definition.state === 'active' ? 'Scope available' : 'Assignment source planned · access closed'}</em>
            </article>
          ))}
        </div>
        </section>

        <aside className="hd-security-notice"><LockKeyhole aria-hidden="true" /><div><strong>Security boundaries remain server-enforced</strong><p>Navigation adapts to the active role, while API authorization, Dataverse assignments, and Fabric RLS remain authoritative for every governed request. Data catalog and governance experiences will align to Microsoft Fabric and OneLake Catalog as Microsoft’s governance platform evolves.</p></div></aside>
      </> : <CopilotCostGovernanceView copilotAccess={copilotAccess} />}
    </section>
  )
}

function CopilotCostGovernanceView({ copilotAccess }: { copilotAccess: CopilotAccessStatus | null }) {
  const hasMicrosoft365Copilot = Boolean(copilotAccess?.hasMicrosoft365Copilot)
  const entitlementConnected = copilotAccess?.licenseCheckStatus === 'Connected'
  const experienceLabel = hasMicrosoft365Copilot ? 'Microsoft 365 Copilot' : 'Copilot Chat'
  const workIqLabel = hasMicrosoft365Copilot ? 'Available, subject to spending policy' : 'Requires Microsoft 365 Copilot'
  const checkedAt = copilotAccess?.checkedAtUtc
    ? new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(copilotAccess.checkedAtUtc))
    : 'Not yet checked'

  return (
    <div className="hd-copilot-governance">
      <div className="hd-security-grid">
        <article className="hd-security-card">
          <header><Sparkles aria-hidden="true" /><div><span>User capability</span><h2>Copilot experience</h2></div></header>
          <dl>
            <div><dt>Available experience</dt><dd>{experienceLabel}</dd></div>
            <div><dt>Microsoft 365 Copilot</dt><dd>{hasMicrosoft365Copilot ? 'Assigned' : entitlementConnected ? 'Not assigned' : 'Not confirmed'}</dd></div>
            <div><dt>Work IQ</dt><dd>{workIqLabel}</dd></div>
            <div><dt>Licence check</dt><dd>{entitlementConnected ? 'Connected to Microsoft Graph' : 'Fallback applied'}</dd></div>
            <div><dt>Last checked</dt><dd>{checkedAt}</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><ShieldCheck aria-hidden="true" /><div><span>Usage governance</span><h2>Spending policy</h2></div></header>
          <dl>
            <div><dt>Integration</dt><dd>Not connected</dd></div>
            <div><dt>User policy</dt><dd>Pending admin data source</dd></div>
            <div><dt>Copilot Credits</dt><dd>No live consumption data loaded</dd></div>
            <div><dt>Enforcement</dt><dd>Microsoft 365 policy remains authoritative</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><BarChart3 aria-hidden="true" /><div><span>Cost management</span><h2>Cost-based billing</h2></div></header>
          <dl>
            <div><dt>Connection</dt><dd>Planned</dd></div>
            <div><dt>Prepaid capacity</dt><dd>Not loaded</dd></div>
            <div><dt>Pay-as-you-go</dt><dd>Not loaded</dd></div>
            <div><dt>Reporting scope</dt><dd>Future admin-only governance view</dd></div>
          </dl>
        </article>

        <article className="hd-security-card">
          <header><Database aria-hidden="true" /><div><span>Nexus integration</span><h2>Connection readiness</h2></div></header>
          <dl>
            <div><dt>Licence entitlement</dt><dd className={entitlementConnected ? 'is-ready' : 'is-planned'}>{entitlementConnected ? 'Connected' : 'Optional check not connected'}</dd></div>
            <div><dt>Work IQ context</dt><dd className={hasMicrosoft365Copilot ? 'is-ready' : 'is-planned'}>{hasMicrosoft365Copilot ? 'Eligible' : 'Chat-only fallback'}</dd></div>
            <div><dt>Spending policy</dt><dd className="is-planned">Integration planned</dd></div>
            <div><dt>Consumption and cost</dt><dd className="is-planned">Integration planned</dd></div>
          </dl>
        </article>
      </div>

      <aside className="hd-security-notice">
        <Sparkles aria-hidden="true" />
        <div>
          <strong>Copilot does not block Nexus access</strong>
          <p>{copilotAccess?.message ?? 'Nexus will provide Copilot Chat when Microsoft 365 Copilot entitlement cannot be confirmed. Work IQ and cost-bearing tools will only be enabled when licensing and the applicable spending policy permit them.'}</p>
        </div>
      </aside>

      <section className="hd-copilot-governance__roadmap" aria-labelledby="copilot-integration-heading">
        <header><div><span>Integration roadmap</span><h2 id="copilot-integration-heading">Administrative data connections</h2><p>This screen is ready for the later Microsoft 365 admin and cost-governance integrations without presenting placeholder values as live tenant data.</p></div></header>
        <div>
          <article><CheckCircle2 aria-hidden="true" /><div><strong>Entitlement check</strong><span>Assigned Microsoft 365 Copilot SKU or Copilot Chat fallback.</span></div></article>
          <article><Clock3 aria-hidden="true" /><div><strong>Spending policy</strong><span>Connect user and group policy assignment when the supported admin data source is approved.</span></div></article>
          <article><Clock3 aria-hidden="true" /><div><strong>Cost-based billing</strong><span>Connect Copilot Credit consumption, prepaid capacity, and pay-as-you-go reporting later.</span></div></article>
        </div>
      </section>
    </div>
  )
}
