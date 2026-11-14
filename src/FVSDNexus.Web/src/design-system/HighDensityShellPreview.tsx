import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  Activity,
  AlertTriangle,
  Archive,
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
  Signature,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
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
type ScreenersAudience = 'executive' | 'school-admin' | 'teacher'
type ProgramPlansAudience = 'executive' | 'school-admin' | 'teacher'
type ProgramPlanStatus = 'All statuses' | 'Draft' | 'Principal Review' | 'Awaiting Signatures' | 'Signed' | 'Archived'
type AnalyticsFocus = 'Literacy' | 'Numeracy' | 'Wellbeing'

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

const navigationGroups: NavigationGroup[] = [
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
      { id: 'data-catalog', label: 'Data Catalog', icon: Database },
      { id: 'data-administration', label: 'Data Administration', icon: Settings },
    ],
  },
]

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
  const [navigationMode, setNavigationMode] = useState<'expanded' | 'rail'>('expanded')
  const [mobileOpen, setMobileOpen] = useState(false)
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
  const [activePlanModule, setActivePlanModule] = useState('Student Details')
  const [planRail, setPlanRail] = useState<PlanRail>(null)
  const [showModuleDescriptions, setShowModuleDescriptions] = useState(false)
  const [includedPlanModules, setIncludedPlanModules] = useState(() => new Set(programPlanModules.map((module) => module.name)))
  const [exportedPlanModules, setExportedPlanModules] = useState(() => new Set(programPlanModules.map((module) => module.name)))
  const [notesAfterPlanSections, setNotesAfterPlanSections] = useState(() => new Set<string>())
  const [screenersAudience, setScreenersAudience] = useState<ScreenersAudience>('executive')
  const [screenersPeriod, setScreenersPeriod] = useState<'Fall' | 'Winter' | 'Spring'>('Fall')
  const [programPlansAudience, setProgramPlansAudience] = useState<ProgramPlansAudience>('executive')
  const [programPlanStatusFilter, setProgramPlanStatusFilter] = useState<ProgramPlanStatus>('All statuses')
  const [programPlanSchoolYear, setProgramPlanSchoolYear] = useState('2026 / 2027')
  const [analyticsSchoolYear, setAnalyticsSchoolYear] = useState('2026 / 2027')
  const [analyticsPeriod, setAnalyticsPeriod] = useState('All periods')
  const [analyticsSchool, setAnalyticsSchool] = useState('All permitted schools')
  const [analyticsGrade, setAnalyticsGrade] = useState('All grades')
  const [analyticsFocus, setAnalyticsFocus] = useState<AnalyticsFocus>('Literacy')
  const [analyticsAssessment, setAnalyticsAssessment] = useState('TOSREC')
  const [collapsedAnalyticsSchools, setCollapsedAnalyticsSchools] = useState(() => new Set<string>())
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)

  const availableSections = getSectionsForGroup(sectionGroupFilter)
  const isScreenersDashboard = activeItem === 'assessments'
  const isProgramPlansDashboard = activeItem === 'individual-plans'
  const isAnalyticsOverview = activeItem === 'overview'
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
  const screenersBreadcrumb = [schoolFilter, sectionGroupFilter, courseFilter, teacherFilter, assessmentTypeFilter].filter(Boolean)
  const programPlansBreadcrumb = [schoolFilter, sectionGroupFilter, teacherFilter, programPlanStatusFilter === 'All statuses' ? '' : programPlanStatusFilter].filter(Boolean)
  const analyticsBreadcrumb = [analyticsFocus, analyticsAssessment, analyticsSchool === 'All permitted schools' ? '' : analyticsSchool, analyticsPeriod === 'All periods' ? '' : analyticsPeriod].filter(Boolean)
  const workspaceBreadcrumb = programPlanOpen && selectedStudent
    ? [selectedStudent.name, 'Student Program Plan']
    : isScreenersDashboard ? screenersBreadcrumb : isProgramPlansDashboard ? programPlansBreadcrumb : isAnalyticsOverview ? analyticsBreadcrumb : filterBreadcrumb
  const activeFilterCount = isScreenersDashboard
    ? screenersBreadcrumb.length + (screenersAudience !== 'executive' ? 1 : 0) + (screenersPeriod !== 'Fall' ? 1 : 0)
    : isProgramPlansDashboard
      ? programPlansBreadcrumb.length + (programPlansAudience !== 'executive' ? 1 : 0) + (programPlanSchoolYear !== '2026 / 2027' ? 1 : 0)
      : isAnalyticsOverview
        ? analyticsBreadcrumb.length + (analyticsGrade !== 'All grades' ? 1 : 0) + (analyticsSchoolYear !== '2026 / 2027' ? 1 : 0)
        : selectedFilterCount
  const visiblePlanModules = programPlanModules.filter((module) => includedPlanModules.has(module.name))
  const screenersView = screenersAudience === 'executive'
    ? {
        title: 'Division completion and recommended actions',
        description: 'Monitor current-period completion across schools and act on the exceptions that need division follow-up.',
        scope: 'Division view', eligible: 151, complete: 83, missing: 2, rate: 98,
        accountabilityTitle: 'Completion by school',
        accountability: [
          ['Florence MacDougall Community School', '98%', 98],
          ['Blue Hills Community School', '94%', 94],
          ['Sand Hills Elementary School', '89%', 89],
        ] as const,
        actions: [
          ['2 Fall TOSREC results remain outstanding', 'High priority', 'Contact the responsible school teams before the assessment window closes.'],
          ['3 schools are below the division completion target', 'Review', 'Confirm local completion plans and any required exemptions.'],
          ['Winter roster readiness check is due', 'Upcoming', 'Validate eligible students before the next assessment window opens.'],
        ] as const,
      }
    : screenersAudience === 'school-admin'
      ? {
          title: 'School completion and teacher follow-up',
          description: 'Identify the teachers and students who need a prompt before the current assessment window closes.',
          scope: 'School administrator view', eligible: 85, complete: 83, missing: 2, rate: 98,
          accountabilityTitle: 'Teacher follow-up',
          accountability: [
            ['Anujan Kirubaharan', '100%', 100],
            ['Deanna Kearney', '94%', 94],
            ['Courtney Petkus', '88%', 88],
          ] as const,
          actions: [
            ['2 teachers need a completion prompt', 'High priority', 'Send a focused reminder with the outstanding student count.'],
            ['2 students remain outstanding for Fall', 'Review', 'Confirm attendance, exemption, or completion status.'],
            ['Review open exemption decisions', 'Governance', 'Resolve incomplete exemption records before period close.'],
          ] as const,
        }
      : {
          title: 'My students and next actions',
          description: 'Complete the outstanding screeners for your assigned students and prepare for the next assessment window.',
          scope: 'Teacher and support staff view', eligible: 17, complete: 15, missing: 2, rate: 88,
          accountabilityTitle: 'Students requiring action',
          accountability: [
            ['Manalili, Arlie Prime David', 'Outstanding', 35],
            ['Moberly, Talia', 'Outstanding', 35],
            ['Current roster verified', 'Complete', 100],
          ] as const,
          actions: [
            ['Complete 2 outstanding Fall screeners', 'High priority', 'Open each student record and enter or exempt the required result.'],
            ['Review one pending exemption', 'Review', 'Confirm the exemption reason is complete and current.'],
            ['Prepare the Winter TOSREC roster', 'Upcoming', 'Review current membership before the next window opens.'],
          ] as const,
        }

  const programPlansView = programPlansAudience === 'executive'
    ? {
        title: 'Division plan progress and governed actions',
        description: 'Monitor Student Program Plans across schools and act on plans waiting for review, signatures, or completion.',
        scope: 'Division view', active: 85, attention: 14, signed: 56, rate: 66,
        accountabilityTitle: 'Plan progress by school',
        accountability: [
          ['Florence MacDougall Community School', '72% signed', 72],
          ['Blue Hills Community School', '66% signed', 66],
          ['Sand Hills Elementary School', '59% signed', 59],
        ] as const,
        actions: [
          ['7 plans are waiting for principal review', 'Review', 'Confirm school-level review coverage and plans approaching the due date.'],
          ['4 signature packages have not been returned', 'Follow up', 'Review outstanding DocuSign recipients and resend where appropriate.'],
          ['18 draft plans need progression', 'Monitor', 'Identify drafts with no recent activity or incomplete required modules.'],
        ] as const,
      }
    : programPlansAudience === 'school-admin'
      ? {
          title: 'School plan review and signature readiness',
          description: 'Focus principal review on complete plans, resolve signature delays, and prompt teachers with outstanding drafts.',
          scope: 'School administrator view', active: 31, attention: 8, signed: 19, rate: 61,
          accountabilityTitle: 'Plan progress by teacher',
          accountability: [
            ['Natalie Morris', '78% signed', 78],
            ['Courtney Petkus', '67% signed', 67],
            ['Anujan Kirubaharan', '54% signed', 54],
          ] as const,
          actions: [
            ['3 plans are ready for principal review', 'High priority', 'Review the exported plan and return or advance it for signatures.'],
            ['2 teachers have drafts with no recent activity', 'Prompt', 'Send a targeted reminder with the affected student plans.'],
            ['3 signature packages require follow-up', 'Follow up', 'Review recipient status before resending or cancelling a request.'],
          ] as const,
        }
      : {
          title: 'My Student Program Plans and next actions',
          description: 'Complete assigned plans, respond to principal feedback, and monitor signature progress for your students.',
          scope: 'Teacher and support staff view', active: 13, attention: 4, signed: 7, rate: 54,
          accountabilityTitle: 'My plan workload',
          accountability: [
            ['Required modules complete', '9 of 13', 69],
            ['Exports generated', '8 of 13', 62],
            ['Plans signed', '7 of 13', 54],
          ] as const,
          actions: [
            ['Complete 2 draft Student Program Plans', 'High priority', 'Finish the required modules and review export inclusion settings.'],
            ['1 plan was returned from principal review', 'Revise', 'Open the plan and address the requested changes before exporting again.'],
            ['Monitor 1 outstanding signature package', 'Follow up', 'Check recipient status and confirm the expected completion date.'],
          ] as const,
        }
  const programPlanQueue: Array<{ student: string; grade: string; school: string; teacher: string; updated: string; status: Exclude<ProgramPlanStatus, 'All statuses'> }> = [
    { student: 'Student, Demo', grade: 'Grade 5', school: 'Florence MacDougall Community School', teacher: 'Natalie Morris', updated: 'Nov 13, 2026', status: 'Principal Review' },
    { student: 'Alook, Josiah King-Lee', grade: 'Grade 3', school: 'Florence MacDougall Community School', teacher: 'Courtney Petkus', updated: 'Nov 12, 2026', status: 'Draft' },
    { student: 'Gerbrandt, Tristan Blake', grade: 'Grade 4', school: 'Blue Hills Community School', teacher: 'Rachel Dika', updated: 'Nov 10, 2026', status: 'Awaiting Signatures' },
    { student: 'Moberly, Talia', grade: 'Grade 3', school: 'Sand Hills Elementary School', teacher: 'Anujan Kirubaharan', updated: 'Nov 08, 2026', status: 'Signed' },
    { student: 'Manalili, Arlie Prime David', grade: 'Grade 3', school: 'Blue Hills Community School', teacher: 'Deanna Kearney', updated: 'Jun 27, 2026', status: 'Archived' },
  ]
  const visibleProgramPlanQueue = programPlanStatusFilter === 'All statuses'
    ? programPlanQueue
    : programPlanQueue.filter((plan) => plan.status === programPlanStatusFilter)
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
              <button type="button" className="hd-navigation__item" aria-label="Settings" title="Settings">
                <Settings aria-hidden="true" />
                <span className="hd-navigation__item-label">Settings</span>
              </button>
            </div>
          </section>
        </nav>

        <footer className="hd-navigation__footer">
          <div className="hd-navigation__role">
            <Sparkles aria-hidden="true" />
            <div><span>Current role</span><strong>Data Analyst</strong></div>
          </div>
          <div className="hd-navigation__account">
            <span aria-hidden="true">SM</span>
            <div><strong>Scott McKenzie</strong><small>scottm@fvsd.ab.ca</small></div>
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
            <span>Administration</span>
            <ol className="hd-workspace__breadcrumb" aria-label={`${isScreenersDashboard ? 'Student Screeners' : isProgramPlansDashboard ? 'Student Program Plans' : isAnalyticsOverview ? 'Analytics Overview' : 'Class Assignment'} filter context`}>
              <li>{isScreenersDashboard ? 'Student Screeners' : isProgramPlansDashboard ? 'Student Program Plans' : isAnalyticsOverview ? 'Analytics Overview' : 'Class Assignment'}</li>
              {workspaceBreadcrumb.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}
            </ol>
          </div>
          <div className="hd-workspace__header-actions">
            {!programPlanOpen ? (
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
            <span className="hd-workspace__environment">Local preview</span>
          </div>
        </header>

        {programPlanOpen && selectedStudent ? (
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
          <div className="hd-class-assignment hd-screeners-layout" data-filters={filtersOpen ? 'open' : 'closed'}>
            <aside className="hd-filter-rail" id="student-screeners-filter-rail" aria-label="Student Screeners filters">
              <header className="hd-filter-rail__header">
                <div><span>Student Screeners</span><h2>Filters</h2></div>
                <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
              </header>
              <form className="hd-filter-rail__body">
                <label>
                  <span>Dashboard View</span>
                  <select value={screenersAudience} onChange={(event) => setScreenersAudience(event.target.value as ScreenersAudience)}>
                    <option value="executive">Executive / Data Analyst</option>
                    <option value="school-admin">School Administrator</option>
                    <option value="teacher">Teacher / Support Staff</option>
                  </select>
                </label>
                <label>
                  <span>School</span>
                  <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                    <option value="">All schools</option>
                    <option>Florence MacDougall Community School</option>
                    <option>Blue Hills Community School</option>
                    <option>Sand Hills Elementary School</option>
                  </select>
                </label>
                <label>
                  <span>Section Group</span>
                  <select value={sectionGroupFilter} onChange={(event) => { setSectionGroupFilter(event.target.value); setCourseFilter(''); setTeacherFilter('') }}>
                    <option value="">All section groups</option>
                    <option>Literacy</option><option>Numeracy</option><option>Foundations</option>
                  </select>
                </label>
                <label>
                  <span>Course Name</span>
                  <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                    <option value="">All course names</option>
                    {availableSections.map((course) => <option key={course.code}>{course.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Teacher</span>
                  <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
                    <option value="">All teachers</option>
                    {availableSections.flatMap((course) => course.teachers).map((teacher) => <option key={teacher.name}>{teacher.name}</option>)}
                  </select>
                </label>
                <div className="hd-filter-rail__history">
                  <span className="hd-filter-rail__history-title">Completion filters</span>
                  <label>
                    <span>Assessment Type</span>
                    <select value={assessmentTypeFilter} onChange={(event) => setAssessmentTypeFilter(event.target.value)}>
                      <option value="">All assessment types</option>
                      <option>TOSREC</option><option>TOWRE</option><option>WRAT-5</option><option>CTOPP</option><option>PNSA</option>
                    </select>
                  </label>
                  <label>
                    <span>Assessment Period</span>
                    <select value={screenersPeriod} onChange={(event) => setScreenersPeriod(event.target.value as 'Fall' | 'Winter' | 'Spring')}>
                      <option>Fall</option><option>Winter</option><option>Spring</option>
                    </select>
                  </label>
                </div>
              </form>
              <footer className="hd-filter-rail__footer">
                <button type="button" onClick={() => {
                  setSchoolFilter('')
                  setSectionGroupFilter('')
                  setCourseFilter('')
                  setTeacherFilter('')
                  setAssessmentTypeFilter('TOSREC')
                  setScreenersPeriod('Fall')
                }}>
                  <RotateCcw aria-hidden="true" /><span>Reset filters</span>
                </button>
              </footer>
            </aside>

            <section className="hd-screeners-dashboard" aria-labelledby="student-screeners-dashboard-heading">
              <header className="hd-screeners-dashboard__heading">
                <div>
                  <span>Actions dashboard</span>
                  <h1 id="student-screeners-dashboard-heading">{screenersView.title}</h1>
                  <p>{screenersView.description}</p>
                </div>
                <div className="hd-screeners-dashboard__heading-actions">
                  <span>{screenersView.scope}</span>
                  <button type="button"><RefreshCw aria-hidden="true" /> Refresh</button>
                </div>
              </header>

              <div className="hd-screeners-dashboard__body">
                <section className="hd-screeners-summary" aria-label="Completion summary">
                  <article><span>Eligible students</span><strong>{screenersView.eligible}</strong><small>Current filtered roster</small><UsersRound aria-hidden="true" /></article>
                  <article className="is-complete"><span>Completed</span><strong>{screenersView.complete}</strong><small>{screenersPeriod} · {assessmentTypeFilter || 'All screeners'}</small><CheckCircle2 aria-hidden="true" /></article>
                  <article className="is-missing"><span>Missing</span><strong>{screenersView.missing}</strong><small>Require follow-up</small><AlertTriangle aria-hidden="true" /></article>
                  <article><span>Completion rate</span><strong>{screenersView.rate}%</strong><small>Target 95%</small><BarChart3 aria-hidden="true" /></article>
                </section>

                <section className="hd-screeners-periods" aria-labelledby="screeners-periods-heading">
                  <header><div><span>Assessment windows</span><h2 id="screeners-periods-heading">Completion by period</h2></div><small>2026 / 2027</small></header>
                  <div>
                    {([
                      ['Fall', screenersView.complete, screenersView.eligible, screenersView.rate, screenersView.missing],
                      ['Winter', 0, screenersView.eligible, 0, screenersView.eligible],
                      ['Spring', 0, screenersView.eligible, 0, screenersView.eligible],
                    ] as const).map(([period, complete, eligible, rate, missing]) => (
                      <button type="button" key={period} className={screenersPeriod === period ? 'is-active' : undefined} onClick={() => setScreenersPeriod(period)}>
                        <span><strong>{period}</strong><small>{period === 'Fall' ? 'Current window' : 'Upcoming window'}</small></span>
                        <span><strong>{complete}</strong> of {eligible} complete</span>
                        <span className="hd-screeners-periods__track"><i style={{ inlineSize: `${rate}%` }} /></span>
                        <span>{missing} missing · {rate}% complete</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="hd-screeners-dashboard__columns">
                  <section className="hd-screeners-actions" aria-labelledby="recommended-actions-heading">
                    <header><div><span>Recommended actions</span><h2 id="recommended-actions-heading">What needs attention</h2></div><strong>{screenersView.actions.length} actions</strong></header>
                    <div>
                      {screenersView.actions.map(([title, priority, detail], index) => (
                        <article key={title}>
                          <span className={index === 0 ? 'is-high' : undefined}>{index === 0 ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
                          <div><strong>{title}</strong><small>{detail}</small></div>
                          <span>{priority}</span>
                          <button type="button" aria-label={`Review ${title}`}><ChevronRight aria-hidden="true" /></button>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="hd-screeners-accountability" aria-labelledby="screeners-accountability-heading">
                    <header><div><span>Accountability</span><h2 id="screeners-accountability-heading">{screenersView.accountabilityTitle}</h2></div><small>{screenersPeriod}</small></header>
                    <div>
                      {screenersView.accountability.map(([label, value, rate]) => (
                        <article key={label}>
                          <div><strong>{label}</strong><span>{value}</span></div>
                          <span><i style={{ inlineSize: `${rate}%` }} /></span>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="hd-screeners-missing" aria-labelledby="missing-students-heading">
                  <header><div><span>Student follow-up</span><h2 id="missing-students-heading">{screenersPeriod} · Missing students ({screenersView.missing})</h2></div><button type="button">View all missing <ChevronRight aria-hidden="true" /></button></header>
                  <div>
                    <article><div><strong>Manalili, Arlie Prime David</strong><span>Grade 3 · ASN 314595398</span></div><span>Result missing</span><button type="button">Review <ChevronRight aria-hidden="true" /></button></article>
                    <article><div><strong>Moberly, Talia</strong><span>Grade 3 · ASN 313779225</span></div><span>Result missing</span><button type="button">Review <ChevronRight aria-hidden="true" /></button></article>
                  </div>
                </section>
              </div>
            </section>
          </div>
        ) : isProgramPlansDashboard ? (
          <div className="hd-class-assignment hd-program-plans-layout" data-filters={filtersOpen ? 'open' : 'closed'}>
            <aside className="hd-filter-rail" id="student-program-plans-filter-rail" aria-label="Student Program Plans filters">
              <header className="hd-filter-rail__header">
                <div><span>Student Program Plans</span><h2>Filters</h2></div>
                <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
              </header>
              <form className="hd-filter-rail__body">
                <label>
                  <span>Dashboard View</span>
                  <select value={programPlansAudience} onChange={(event) => setProgramPlansAudience(event.target.value as ProgramPlansAudience)}>
                    <option value="executive">Executive / Data Analyst</option>
                    <option value="school-admin">School Administrator</option>
                    <option value="teacher">Teacher / Support Staff</option>
                  </select>
                </label>
                <label>
                  <span>School</span>
                  <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                    <option value="">All schools</option>
                    <option>Florence MacDougall Community School</option>
                    <option>Blue Hills Community School</option>
                    <option>Sand Hills Elementary School</option>
                  </select>
                </label>
                <label>
                  <span>Section Group</span>
                  <select value={sectionGroupFilter} onChange={(event) => { setSectionGroupFilter(event.target.value); setTeacherFilter('') }}>
                    <option value="">All section groups</option>
                    <option>Foundations</option><option>Homeroom</option>
                  </select>
                </label>
                <label>
                  <span>Teacher</span>
                  <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
                    <option value="">All teachers</option>
                    <option>Natalie Morris</option><option>Courtney Petkus</option><option>Anujan Kirubaharan</option><option>Deanna Kearney</option>
                  </select>
                </label>
                <div className="hd-filter-rail__history">
                  <span className="hd-filter-rail__history-title">Plan filters</span>
                  <label>
                    <span>School Year</span>
                    <select value={programPlanSchoolYear} onChange={(event) => setProgramPlanSchoolYear(event.target.value)}>
                      <option>2026 / 2027</option><option>2025 / 2026</option>
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
                  setSchoolFilter('')
                  setSectionGroupFilter('')
                  setTeacherFilter('')
                  setProgramPlanSchoolYear('2026 / 2027')
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
                  <button type="button"><RefreshCw aria-hidden="true" /> Refresh</button>
                </div>
              </header>

              <div className="hd-screeners-dashboard__body">
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
                      ['Draft', 18, Pencil],
                      ['Principal Review', 7, Eye],
                      ['Awaiting Signatures', 4, Signature],
                      ['Signed', 56, CheckCircle2],
                      ['Archived', 12, Archive],
                    ] as const).map(([status, count, StatusIcon]) => (
                      <button type="button" key={status} className={`is-${status.toLowerCase().replaceAll(' ', '-')}${programPlanStatusFilter === status ? ' is-active' : ''}`} onClick={() => setProgramPlanStatusFilter(status)}>
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
                      {programPlansView.actions.map(([title, priority, detail], index) => (
                        <article key={title}>
                          <span className={index === 0 ? 'is-high' : undefined}>{index === 0 ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
                          <div><strong>{title}</strong><small>{detail}</small></div>
                          <span>{priority}</span>
                          <button type="button" aria-label={`Review ${title}`}><ChevronRight aria-hidden="true" /></button>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="hd-screeners-accountability" aria-labelledby="program-plan-accountability-heading">
                    <header><div><span>Accountability</span><h2 id="program-plan-accountability-heading">{programPlansView.accountabilityTitle}</h2></div><small>Signed</small></header>
                    <div>
                      {programPlansView.accountability.map(([label, value, rate]) => (
                        <article key={label}><div><strong>{label}</strong><span>{value}</span></div><span><i style={{ inlineSize: `${rate}%` }} /></span></article>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="hd-program-plan-queue" aria-labelledby="program-plan-queue-heading">
                  <header>
                    <div><span>Plan work queue</span><h2 id="program-plan-queue-heading">Plans requiring visibility</h2></div>
                    <strong>{visibleProgramPlanQueue.length} {visibleProgramPlanQueue.length === 1 ? 'plan' : 'plans'}</strong>
                  </header>
                  <div>
                    {visibleProgramPlanQueue.length ? visibleProgramPlanQueue.map((plan) => (
                      <article key={`${plan.student}-${plan.status}`}>
                        <div><strong>{plan.student}</strong><small>{plan.grade} · {plan.school}</small></div>
                        <span><small>Teacher</small><strong>{plan.teacher}</strong></span>
                        <span><small>Last updated</small><strong>{plan.updated}</strong></span>
                        <em className={`is-${plan.status.toLowerCase().replaceAll(' ', '-')}`}>{plan.status}</em>
                        <button type="button"><Eye aria-hidden="true" /> Open</button>
                      </article>
                    )) : (
                      <div className="hd-program-plan-queue__empty"><FileText aria-hidden="true" /><span><strong>No matching plans</strong><small>Change the Plan Status filter to review another lifecycle stage.</small></span></div>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </div>
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
