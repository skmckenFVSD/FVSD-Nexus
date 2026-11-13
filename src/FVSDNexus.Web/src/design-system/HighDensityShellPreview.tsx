import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  Home,
  Eye,
  Menu,
  Pencil,
  RotateCcw,
  Save,
  School,
  Settings,
  Shield,
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

const studentRoster: StudentRecord[] = [
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
  if (sectionGroup === 'Foundations') return [...literacy, ...numeracy]
  return literacy
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
  const [historyPeriod, setHistoryPeriod] = useState<'current' | 'previous'>('current')
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('')
  const [assessmentModal, setAssessmentModal] = useState<AssessmentModalState>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)

  const filterBreadcrumb = [schoolFilter, sectionGroupFilter, courseFilter, teacherFilter, studentFilter].filter(Boolean)
  const selectedFilterCount = filterBreadcrumb.length + (studentFilter ? 1 : 0) + (assessmentTypeFilter ? 1 : 0)
  const selectedStudent = studentFilter ? studentRoster.find((student) => student.name === studentFilter) ?? null : null
  const visibleStudents = studentFilter ? studentRoster.filter((student) => student.name === studentFilter) : studentRoster
  const historyAssessmentGroups = selectedStudent ? getHistoryAssessmentGroups(selectedStudent.grade, sectionGroupFilter) : []
  const visibleHistoryAssessmentGroups = assessmentTypeFilter ? [assessmentTypeFilter] : historyAssessmentGroups

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
    setMobileOpen(false)
  }

  const toggleGroup = (id: string) => {
    setExpandedGroup((current) => current === id ? null : id)
  }

  const openClass = (course: CourseSection, teacher: TeacherSection) => {
    setCourseFilter(course.name)
    setTeacherFilter(teacher.name)
    setStudentFilter('')
    setHistoryPeriod('current')
    setAssessmentTypeFilter('')
    setSelectedClass({ course, teacher })
  }

  const closeClass = () => {
    setTeacherFilter('')
    setStudentFilter('')
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
            <ol className="hd-workspace__breadcrumb" aria-label="Class Assignment filter context">
              <li>Class Assignment</li>
              {filterBreadcrumb.map((value) => <li key={value}>{value}</li>)}
            </ol>
          </div>
          <div className="hd-workspace__header-actions">
            <button
              ref={filterTriggerRef}
              type="button"
              className="hd-workspace__filter-trigger"
              aria-controls="class-assignment-filter-rail"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal aria-hidden="true" />
              <span>Filters</span>
              <strong aria-label={`${selectedFilterCount} filters selected`}>{selectedFilterCount}</strong>
            </button>
            <span className="hd-workspace__environment">Local preview</span>
          </div>
        </header>

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
                    setAssessmentTypeFilter('')
                    setHistoryPeriod('current')
                    setSelectedClass(null)
                  }}
                >
                  <option value="">All course names</option>
                  {literacySections.map((course) => <option key={course.code}>{course.name}</option>)}
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
                    setAssessmentTypeFilter('')
                    setHistoryPeriod('current')
                    if (!teacherName) {
                      setSelectedClass(null)
                      return
                    }
                    const course = literacySections.find((item) => item.teachers.some((teacher) => teacher.name === teacherName))
                    const teacher = course?.teachers.find((item) => item.name === teacherName)
                    if (course && teacher) {
                      setCourseFilter(course.name)
                      setSelectedClass({ course, teacher })
                    }
                  }}
                >
                  <option value="">All teachers</option>
                  {literacySections.flatMap((course) => course.teachers).map((teacher) => <option key={teacher.name}>{teacher.name}</option>)}
                </select>
              </label>
              {selectedClass ? (
                <label>
                  <span>Student</span>
                  <select
                    value={studentFilter}
                    onChange={(event) => {
                      setStudentFilter(event.target.value)
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
                  <label>
                    <span>School Years</span>
                    <select value={historyPeriod} onChange={(event) => setHistoryPeriod(event.target.value as 'current' | 'previous')}>
                      <option value="current">Current Year</option>
                      <option value="previous">Previous Years</option>
                    </select>
                  </label>
                  <label>
                    <span>Assessment Type</span>
                    <select value={assessmentTypeFilter} onChange={(event) => setAssessmentTypeFilter(event.target.value)}>
                      <option value="">All assessment types</option>
                      {historyAssessmentGroups.map((assessmentType) => <option key={assessmentType}>{assessmentType}</option>)}
                    </select>
                  </label>
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
                  setHistoryPeriod('current')
                  setAssessmentTypeFilter('')
                  setSelectedClass(null)
                }}
              >
                <RotateCcw aria-hidden="true" /><span>Reset filters</span>
              </button>
            </footer>
          </aside>

          <section className="hd-class-sections" aria-labelledby="literacy-sections-title">
            <header className="hd-class-sections__heading">
              <div>
                <span>{selectedClass ? 'Assigned students' : 'Available teacher sections'}</span>
                <h1 id="literacy-sections-title">
                  {selectedClass ? `${selectedClass.course.name} · ${selectedClass.teacher.name}` : 'Literacy Sections'}
                </h1>
                <p>{selectedClass ? (selectedStudent ? `${selectedStudent.name} selected for student history.` : `${selectedClass.teacher.students} assigned students loaded from Dataverse.`) : 'Select a teacher section to load its current student roster.'}</p>
              </div>
              <span className="hd-class-sections__count">
                <UsersRound aria-hidden="true" />
                {selectedClass ? (selectedStudent ? '1 student' : `${selectedClass.teacher.students} students`) : '11 sections'}
              </span>
            </header>
            <div className="hd-class-sections__body">
              {selectedClass ? (
                <>
                  <article className="hd-course-section hd-selected-course">
                    <header>
                      <GraduationCap aria-hidden="true" />
                      <div><h2>{selectedClass.course.name}</h2><span>Literacy · {selectedClass.course.code}</span></div>
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

                  {selectedStudent ? (
                    <section className="hd-student-history" aria-labelledby="student-history-heading">
                      <header>
                        <div>
                          <span>{sectionGroupFilter || 'Student'}</span>
                          <h2 id="student-history-heading">Assessment History</h2>
                          <p>Assessment history is grouped by assessment type and focus area.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAssessmentModal({
                            mode: 'create',
                            assessmentType: assessmentTypeFilter || historyAssessmentGroups[0] || 'TOSREC',
                          })}
                        >
                          Add assessment
                        </button>
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
                                  <button type="button" onClick={() => setAssessmentModal({ mode: 'view', assessmentType })}><Eye aria-hidden="true" />View</button>
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
              ) : literacySections.map((course) => (
                  <article className="hd-course-section" key={course.code}>
                    <header>
                      <GraduationCap aria-hidden="true" />
                      <div><h2>{course.name}</h2><span>Literacy · {course.code}</span></div>
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
