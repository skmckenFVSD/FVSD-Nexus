import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  UsersRound,
  X,
} from 'lucide-react'
import { StudentAssessmentPanel, StudentPlanPanel } from './AssessmentWorkspace'
import type { IppPreviewContext } from './IppPreview'

type SchoolOption = { id: string; name: string }
type SectionGroupOption = { value: string; label: string; sortOrder: number }

type WorkspaceContext = {
  role: string
  schools: SchoolOption[]
  defaultSchoolId: string | null
  schoolSelectionEnabled: boolean
  teacherLockedToSignedInUser: boolean
}

type TeacherSection = {
  id: string
  sectionNumber: string
  schoolId: string
  schoolName: string
  sectionGroup: string
  sectionGroupOrder: number
  courseNumber: string
  courseName: string
  sortOrder: number
  teacherId: string
  teacherName: string
  studentCount: number
}

type Student = {
  studentSectionId: string
  id: string
  name: string
  obfuscatedName?: string
  asn?: string
  obfuscatedAsn?: string
  dateOfBirth?: string
  gender?: string
  grade?: string
  spedCategory?: string
}

type Selection = {
  schoolId: string
  sectionGroup: string
  courseNumber: string
  teacherId: string
  studentId: string
}

type ClassAssignmentContext = {
  breadcrumb: string[]
  filterCount: number
}

type Props = {
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  onContextChange: (context: ClassAssignmentContext) => void
  studentDisplayMode: 'real' | 'obfuscated'
  currentSchoolYear?: string
  onOpenIpp?: (context: IppPreviewContext) => void
}

class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; error?: string } | null
    throw new ApiRequestError(problem?.title ?? problem?.error ?? `Request failed (${response.status})`, response.status)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new ApiRequestError('Your Microsoft session needs to be reconnected before governed data can be loaded.', 401)
  }
  return response.json() as Promise<T>
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  return [...new Map(items.map((item) => [key(item), item])).values()]
}

function compareSections(left: TeacherSection, right: TeacherSection) {
  return left.sortOrder - right.sortOrder
    || left.courseName.localeCompare(right.courseName)
    || left.teacherName.localeCompare(right.teacherName)
}

const emptySelection: Selection = {
  schoolId: '',
  sectionGroup: '',
  courseNumber: '',
  teacherId: '',
  studentId: '',
}

export function ClassAssignmentWorkspaceV2({ filtersOpen, setFiltersOpen, onContextChange, studentDisplayMode, currentSchoolYear, onOpenIpp }: Props) {
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [selection, setSelection] = useState<Selection>(emptySelection)
  const [sectionGroups, setSectionGroups] = useState<SectionGroupOption[]>([])
  const [sections, setSections] = useState<TeacherSection[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [loadingContext, setLoadingContext] = useState(true)
  const [loadingSectionGroups, setLoadingSectionGroups] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState('')
  const [needsReconnect, setNeedsReconnect] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingContext(true)
    getJson<WorkspaceContext>('/api/assessments/context')
      .then((workspaceContext) => {
        if (cancelled) return
        setContext(workspaceContext)
        setSelection((current) => ({
          ...current,
          schoolId: current.schoolId || workspaceContext.defaultSchoolId || '',
        }))
      })
      .catch((requestError: Error) => {
        if (cancelled) return
        setError(requestError.message)
        setNeedsReconnect(requestError instanceof ApiRequestError && requestError.status === 401)
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setSectionGroups([])
    if (!selection.schoolId) return
    setLoadingSectionGroups(true)
    setError('')
    getJson<SectionGroupOption[]>(`/api/assessments/section-groups?schoolId=${encodeURIComponent(selection.schoolId)}`)
      .then((options) => {
        if (!cancelled) setSectionGroups(options)
      })
      .catch((requestError: Error) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingSectionGroups(false)
      })
    return () => { cancelled = true }
  }, [selection.schoolId])

  useEffect(() => {
    let cancelled = false
    setSections([])
    setStudents([])
    setSelectedSectionId('')
    if (!selection.schoolId || !selection.sectionGroup) return
    setLoadingSections(true)
    setError('')
    const query = new URLSearchParams({
      schoolId: selection.schoolId,
      sectionGroup: selection.sectionGroup,
    })
    getJson<TeacherSection[]>(`/api/assessments/teacher-sections?${query.toString()}`)
      .then((rows) => {
        if (cancelled) return
        setSections(rows)
        if (context?.teacherLockedToSignedInUser) {
          const teacherIds = uniqueBy(rows, (row) => row.teacherId).map((row) => row.teacherId)
          if (teacherIds.length === 1) {
            setSelection((current) => ({ ...current, teacherId: teacherIds[0] }))
          }
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingSections(false)
      })
    return () => { cancelled = true }
  }, [selection.schoolId, selection.sectionGroup, context?.teacherLockedToSignedInUser])

  const courseOptions = useMemo(() => uniqueBy(
    sections.filter((section) => section.studentCount > 0),
    (section) => section.courseNumber,
  ).sort(compareSections), [sections])

  const teacherOptions = useMemo(() => uniqueBy(
    sections.filter((section) => (!selection.courseNumber || section.courseNumber === selection.courseNumber) && section.studentCount > 0),
    (section) => section.teacherId,
  ).sort((left, right) => left.teacherName.localeCompare(right.teacherName)), [sections, selection.courseNumber])

  const visibleSections = useMemo(() => sections.filter((section) =>
    (!selection.courseNumber || section.courseNumber === selection.courseNumber)
    && (!selection.teacherId || section.teacherId === selection.teacherId)
    && section.studentCount > 0,
  ), [sections, selection.courseNumber, selection.teacherId])

  const courseGroups = useMemo(() => {
    const grouped = new Map<string, TeacherSection[]>()
    visibleSections.forEach((section) => {
      const key = `${section.courseNumber}|${section.courseName}`
      grouped.set(key, [...(grouped.get(key) ?? []), section])
    })
    return [...grouped.values()]
  }, [visibleSections])

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null
  const selectedStudent = students.find((student) => student.id === selection.studentId) ?? null
  const normalizedSectionGroup = selection.sectionGroup.trim().toLowerCase()
  const showAssessmentHistory = ['literacy', 'numeracy', 'mathematics', 'foundations'].includes(normalizedSectionGroup)
  const showProgramPlanHistory = ['homeroom', 'foundations'].includes(normalizedSectionGroup)
  const selectedSchool = context?.schools.find((school) => school.id === selection.schoolId) ?? null
  const displayStudentName = (student: Student) => studentDisplayMode === 'obfuscated' ? student.obfuscatedName ?? student.name : student.name
  const displayStudentAsn = (student: Student) => studentDisplayMode === 'obfuscated' ? student.obfuscatedAsn ?? student.asn : student.asn

  useEffect(() => {
    const breadcrumb = [
      selectedSchool?.name,
      selection.sectionGroup,
      selectedSection?.courseName ?? courseOptions.find((course) => course.courseNumber === selection.courseNumber)?.courseName,
      selectedSection?.teacherName ?? teacherOptions.find((teacher) => teacher.teacherId === selection.teacherId)?.teacherName,
      selectedStudent ? displayStudentName(selectedStudent) : undefined,
    ].filter((value): value is string => Boolean(value))
    onContextChange({ breadcrumb, filterCount: breadcrumb.length })
  }, [courseOptions, onContextChange, selectedSchool?.name, selectedSection, selectedStudent, selection.courseNumber, selection.sectionGroup, selection.teacherId, studentDisplayMode, teacherOptions])

  const changeSchool = (schoolId: string) => {
    setSelection({ ...emptySelection, schoolId })
    setStudents([])
    setSelectedSectionId('')
  }

  const changeSectionGroup = (sectionGroup: string) => {
    setSelection((current) => ({
      ...current,
      sectionGroup,
      courseNumber: '',
      teacherId: context?.teacherLockedToSignedInUser ? current.teacherId : '',
      studentId: '',
    }))
    setStudents([])
    setSelectedSectionId('')
  }

  const chooseSection = async (section: TeacherSection) => {
    setSelectedSectionId(section.id)
    setSelection((current) => ({
      ...current,
      sectionGroup: section.sectionGroup,
      courseNumber: section.courseNumber,
      teacherId: section.teacherId,
      studentId: '',
    }))
    setStudents([])
    setLoadingStudents(true)
    setError('')
    try {
      const rows = await getJson<Student[]>(`/api/assessments/teacher-sections/${encodeURIComponent(section.id)}/students`)
      setStudents([...rows].sort((left, right) => displayStudentName(left).localeCompare(displayStudentName(right))))
    } catch (requestError) {
      setSelectedSectionId('')
      setError(requestError instanceof Error ? requestError.message : 'Students could not be loaded.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const reset = () => {
    setSelection({ ...emptySelection, schoolId: context?.defaultSchoolId ?? '' })
    setStudents([])
    setSelectedSectionId('')
    setError('')
  }

  const returnToList = () => {
    if (selectedStudent) {
      setSelection((current) => ({ ...current, studentId: '' }))
      return
    }
    setSelectedSectionId('')
    setStudents([])
    setSelection((current) => ({ ...current, studentId: '' }))
  }

  return (
    <div className="hd-class-assignment" data-filters={filtersOpen ? 'open' : 'closed'}>
      <aside className="hd-filter-rail" id="class-assignment-filter-rail" aria-label="Class Assignment filters">
        <header className="hd-filter-rail__header">
          <div><span>Class Assignment</span><h2>Filters</h2></div>
          <button type="button" aria-label="Close filters" title="Close filters" onClick={() => setFiltersOpen(false)}><X aria-hidden="true" /></button>
        </header>
        <form className="hd-filter-rail__body">
          <label>
            <span>School</span>
            <select value={selection.schoolId} disabled={!context?.schoolSelectionEnabled || loadingContext} onChange={(event) => changeSchool(event.target.value)}>
              <option value="">Select school</option>
              {(context?.schools ?? []).map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </label>
          <label>
            <span>Section Group</span>
            <select value={selection.sectionGroup} disabled={!selection.schoolId || loadingSectionGroups} onChange={(event) => changeSectionGroup(event.target.value)}>
              <option value="">Select section group</option>
              {[...sectionGroups].sort((left, right) => left.sortOrder - right.sortOrder).map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
            </select>
          </label>
          <label>
            <span>Course Name</span>
            <select
              value={selection.courseNumber}
              disabled={!selection.sectionGroup || loadingSections}
              onChange={(event) => {
                setSelection((current) => ({
                  ...current,
                  courseNumber: event.target.value,
                  teacherId: context?.teacherLockedToSignedInUser ? current.teacherId : '',
                  studentId: '',
                }))
                setSelectedSectionId('')
                setStudents([])
              }}
            >
              <option value="">All course names</option>
              {courseOptions.map((course) => <option key={course.courseNumber} value={course.courseNumber}>{course.courseName}</option>)}
            </select>
          </label>
          <label>
            <span>Teacher</span>
            <select
              value={selection.teacherId}
              disabled={!selection.sectionGroup || loadingSections || Boolean(context?.teacherLockedToSignedInUser)}
              onChange={(event) => {
                setSelection((current) => ({ ...current, teacherId: event.target.value, studentId: '' }))
                setSelectedSectionId('')
                setStudents([])
              }}
            >
              <option value="">All teachers</option>
              {teacherOptions.map((teacher) => <option key={teacher.teacherId} value={teacher.teacherId}>{teacher.teacherName}</option>)}
            </select>
          </label>
          {selectedSection ? (
            <label>
              <span>Student</span>
              <select value={selection.studentId} disabled={loadingStudents} onChange={(event) => setSelection((current) => ({ ...current, studentId: event.target.value }))}>
                <option value="">All students</option>
                {students.map((student) => <option key={student.id} value={student.id}>{displayStudentName(student)}</option>)}
              </select>
            </label>
          ) : null}
        </form>
        <footer className="hd-filter-rail__footer">
          <button type="button" onClick={reset}><RotateCcw aria-hidden="true" /><span>Reset filters</span></button>
        </footer>
      </aside>

      <section className="hd-class-sections" aria-labelledby="live-teacher-sections-title">
        <header className="hd-class-sections__heading">
          <div>
            <span>{selectedSection ? 'Assigned students' : 'Available teacher sections'}</span>
            <h1 id="live-teacher-sections-title">
              {selectedSection ? `${selectedSection.courseName} · ${selectedSection.teacherName}` : `${selection.sectionGroup || 'Teacher'} Sections`}
            </h1>
            <p>{selectedSection ? (selectedStudent ? `${displayStudentName(selectedStudent)} selected for student history.` : `${students.length || selectedSection.studentCount} assigned students loaded from Dataverse.`) : 'Select a teacher section to load its current student roster.'}</p>
          </div>
          <span className="hd-class-sections__count"><UsersRound aria-hidden="true" />{selectedSection ? (selectedStudent ? '1 student' : `${students.length || selectedSection.studentCount} students`) : `${visibleSections.length} sections`}</span>
        </header>

        <div className="hd-class-sections__body">
          {loadingContext || loadingSectionGroups || loadingSections || loadingStudents ? (
            <div className="hd-live-workspace-state"><LoaderCircle className="is-spinning" aria-hidden="true" /><div><strong>Loading governed Class Assignment data</strong><span>The new shell is using the existing Dataverse-backed API.</span></div></div>
          ) : needsReconnect ? (
            <div className="hd-live-workspace-state is-error"><CircleAlert aria-hidden="true" /><div><strong>Reconnect your Microsoft session</strong><span>{error}</span><a href="/api/auth/signin">Reconnect Microsoft services</a></div></div>
          ) : error ? (
            <div className="hd-live-workspace-state is-error"><CircleAlert aria-hidden="true" /><div><strong>Class Assignment data could not be loaded</strong><span>{error}</span></div></div>
          ) : !selection.sectionGroup ? (
            <div className="hd-live-workspace-state"><GraduationCap aria-hidden="true" /><div><strong>Select a Section Group</strong><span>Available course and teacher sections will appear here.</span></div></div>
          ) : selectedSection ? (
            <>
              <article className="hd-course-section hd-selected-course">
                <header><GraduationCap aria-hidden="true" /><div><h2>{selectedSection.courseName}</h2><span>{selectedSection.sectionGroup} · {selectedSection.courseNumber}</span></div></header>
                <div className="hd-selected-course__body">
                  <div className="hd-selected-course__teacher">
                    <span className="hd-teacher-card__icon"><UsersRound aria-hidden="true" /></span>
                    <span className="hd-teacher-card__copy"><strong>{selectedSection.teacherName}</strong><small>{selectedSection.studentCount} students</small></span>
                  </div>
                  {selectedStudent ? (
                    <div className="hd-selected-course__student">
                      <span><strong>{displayStudentName(selectedStudent)}</strong><small>{selectedStudent.grade ?? 'Grade not recorded'}</small></span>
                      <span><small>ASN</small><strong>{displayStudentAsn(selectedStudent) ?? 'Not available'}</strong></span>
                    </div>
                  ) : null}
                  <button type="button" className="hd-selected-course__back" onClick={returnToList}><ChevronLeft aria-hidden="true" />{selectedStudent ? 'Back to student list' : 'Back to sections'}</button>
                </div>
              </article>

              {selectedStudent ? (
                <div className="hd-student-history-stack">
                  {showProgramPlanHistory && selectedSection ? (
                    <StudentPlanPanel
                      student={selectedStudent}
                      studentDisplayMode={studentDisplayMode}
                      currentSchoolYear={currentSchoolYear}
                      teacherSectionId={selectedSection.id}
                      teacherSection={selectedSection}
                      onOpenIpp={onOpenIpp}
                    />
                  ) : null}

                  {showAssessmentHistory && selectedSection ? (
                    <StudentAssessmentPanel
                      student={selectedStudent}
                      studentDisplayMode={studentDisplayMode}
                      currentSchoolYear={currentSchoolYear}
                      focusArea={selectedSection.sectionGroup}
                      teacherSectionId={selectedSection.id}
                      teacherSection={selectedSection}
                      role={context?.role ?? ''}
                      onAssessmentChanged={() => {}}
                    />
                  ) : null}
                </div>
              ) : (
                <section className="hd-student-roster" aria-label="Assigned students">
                  <div className="hd-student-grid">
                    {students.map((student) => (
                      <button type="button" className="hd-student-card" key={student.id} onClick={() => setSelection((current) => ({ ...current, studentId: student.id }))}>
                        <span className="hd-student-card__heading"><strong>{displayStudentName(student)}</strong><small>{student.grade ?? 'Grade not recorded'}</small></span>
                        <span className="hd-student-card__details">
                          <span><small>ASN</small><strong>{displayStudentAsn(student) ?? 'Not available'}</strong></span>
                          <span><small>Date of birth</small><strong>{student.dateOfBirth ?? 'Not available'}</strong></span>
                          <span><small>Gender</small><strong>{student.gender ?? 'Not available'}</strong></span>
                          <span><small>SPED</small><strong>{student.spedCategory ?? 'Not coded'}</strong></span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : courseGroups.length ? courseGroups.map((courseSections) => {
            const course = courseSections[0]
            return (
              <article className="hd-course-section" key={`${course.courseNumber}-${course.courseName}`}>
                <header><GraduationCap aria-hidden="true" /><div><h2>{course.courseName}</h2><span>{course.sectionGroup} · {course.courseNumber}</span></div></header>
                <div className="hd-teacher-grid">
                  {courseSections.map((section) => (
                    <button type="button" className="hd-teacher-card" key={section.id} onClick={() => void chooseSection(section)}>
                      <span className="hd-teacher-card__icon"><UsersRound aria-hidden="true" /></span>
                      <span className="hd-teacher-card__copy"><strong>{section.teacherName}</strong><small>{section.studentCount} students</small></span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </article>
            )
          }) : (
            <div className="hd-live-workspace-state"><GraduationCap aria-hidden="true" /><div><strong>No teacher sections match these filters</strong><span>Change the Course Name or Teacher filter to widen the result.</span></div></div>
          )}
        </div>
      </section>
    </div>
  )
}
