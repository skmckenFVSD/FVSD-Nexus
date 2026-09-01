import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  ListRestart,
  RotateCcw,
  School,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react'

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
  gradeValue?: number
  spedCategory?: string
  spedSeries?: string
  fnmi?: string
  eslCategory?: string
  spokenLanguage?: string
}

type AssessmentHistoryRecord = {
  id: string
  assessmentType: string
  schoolYear: string
  period: string
  periodSortOrder: number
  assessmentDate?: string
  gradeAtAssessment?: string
  rawScore?: number
  standardScore?: number
  descriptiveTerm: string
  descriptiveTermFill?: string
  descriptiveTermFont?: string
  exempt: boolean
}

type Selection = {
  schoolId: string
  sectionGroup: string
  courseNumber: string
  teacherId: string
  studentId: string
}

const emptySelection: Selection = {
  schoolId: '',
  sectionGroup: '',
  courseNumber: '',
  teacherId: '',
  studentId: '',
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string } | null
    throw new ApiRequestError(problem?.title ?? `Request failed (${response.status})`, response.status)
  }
  return response.json() as Promise<T>
}

class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function AssessmentWorkspace({ currentSchoolYear }: { currentSchoolYear?: string }) {
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
  const [error, setError] = useState<string | null>(null)
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
          schoolId: workspaceContext.defaultSchoolId ?? '',
        }))
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setError(requestError.message)
          setNeedsReconnect(requestError instanceof ApiRequestError && requestError.status === 401)
        }
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
    setError(null)
    getJson<SectionGroupOption[]>(
      `/api/assessments/section-groups?schoolId=${encodeURIComponent(selection.schoolId)}`,
    )
      .then((options) => {
        if (!cancelled) setSectionGroups(options)
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setError(requestError.message)
          setNeedsReconnect(requestError instanceof ApiRequestError && requestError.status === 401)
        }
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
    setError(null)
    const query = new URLSearchParams({
      schoolId: selection.schoolId,
      sectionGroup: selection.sectionGroup,
    })
    getJson<TeacherSection[]>(`/api/assessments/teacher-sections?${query.toString()}`)
      .then((rows) => {
        if (cancelled) return
        setSections(rows)
        if (context?.teacherLockedToSignedInUser) {
          const teacherIds = unique(rows.map((row) => row.teacherId))
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
    sections.filter((section) =>
      (!selection.sectionGroup || section.sectionGroup === selection.sectionGroup)
      && (!selection.teacherId || section.teacherId === selection.teacherId)
      && section.studentCount > 0),
    (section) => section.courseNumber,
  ).sort(compareSections), [sections, selection.sectionGroup, selection.teacherId])

  const teacherOptions = useMemo(() => uniqueBy(
    sections.filter((section) =>
      (!selection.sectionGroup || section.sectionGroup === selection.sectionGroup)
      && (!selection.courseNumber || section.courseNumber === selection.courseNumber)
      && section.studentCount > 0),
    (section) => section.teacherId,
  ).sort((left, right) => left.teacherName.localeCompare(right.teacherName)), [sections, selection.sectionGroup, selection.courseNumber])

  const visibleSections = useMemo(() => sections.filter((section) =>
    (!selection.sectionGroup || section.sectionGroup === selection.sectionGroup)
    && (!selection.courseNumber || section.courseNumber === selection.courseNumber)
    && (!selection.teacherId || section.teacherId === selection.teacherId)
    && section.studentCount > 0,
  ), [sections, selection.sectionGroup, selection.courseNumber, selection.teacherId])

  const courseGroups = useMemo(() => {
    const grouped = new Map<string, TeacherSection[]>()
    visibleSections.forEach((section) => {
      const key = `${section.courseNumber}|${section.courseName}`
      grouped.set(key, [...(grouped.get(key) ?? []), section])
    })
    return [...grouped.values()]
  }, [visibleSections])

  const selectedSection = sections.find((section) => section.id === selectedSectionId)
  const selectedStudent = students.find((student) => student.id === selection.studentId)

  const clearLoadedStudents = () => {
    setSelectedSectionId('')
    setStudents([])
    setSelection((current) => ({ ...current, studentId: '' }))
  }

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
    clearLoadedStudents()
  }

  const changeCourse = (courseNumber: string) => {
    setSelection((current) => ({ ...current, courseNumber, studentId: '' }))
    clearLoadedStudents()
  }

  const changeTeacher = (teacherId: string) => {
    setSelection((current) => ({ ...current, teacherId, studentId: '' }))
    clearLoadedStudents()
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
    setError(null)
    try {
      const rows = await getJson<Student[]>(`/api/assessments/teacher-sections/${section.id}/students`)
      setStudents(rows)
    } catch (requestError) {
      setSelectedSectionId('')
      setError(requestError instanceof Error ? requestError.message : 'Students could not be loaded.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const reset = () => {
    setSelection((current) => ({
      ...emptySelection,
      schoolId: current.schoolId || context?.defaultSchoolId || '',
    }))
    setSelectedSectionId('')
    setStudents([])
    setError(null)
  }

  const selectStudent = (studentId: string) => {
    setSelection((current) => ({ ...current, studentId }))
  }

  if (loadingContext) {
    return <div className="assessment-loading">Loading your governed Class Assignment workspace…</div>
  }

  if (needsReconnect) {
    return (
      <section className="assessment-session-panel">
        <div className="sign-in-icon"><BookOpenCheck size={30} /></div>
        <span className="eyebrow">Delegated Dataverse connection</span>
        <h2>Reconnect your Microsoft session</h2>
        <p>{error ?? 'Your browser sign-in is still valid, but the delegated service session needs to be refreshed.'}</p>
        <a className="primary-button" href="/api/auth/signin">Reconnect Microsoft services</a>
      </section>
    )
  }

  return (
    <div className="assessment-workspace">
      <section className="assessment-filter-panel" aria-label="Assessment filters">
        <div className="assessment-panel-heading">
          <div>
            <span className="eyebrow">Assessment context</span>
            <h2>Find a teacher section</h2>
            <p>Choose a school, section group, course and teacher to load the assigned students.</p>
          </div>
          <div className="assessment-role-badge"><BookOpenCheck size={15} />{context?.role}</div>
        </div>

        <div className="assessment-filter-grid">
          <SelectFilter
            label="School"
            value={selection.schoolId}
            placeholder="Select school"
            options={(context?.schools ?? []).map((school) => ({ value: school.id, label: school.name }))}
            disabled={!context?.schoolSelectionEnabled}
            onChange={changeSchool}
          />
          <SelectFilter
            label="Section Group"
            value={selection.sectionGroup}
            placeholder="Select section group"
            options={[...sectionGroups]
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((section) => ({ value: section.value, label: section.label }))}
            disabled={!selection.schoolId || loadingSectionGroups}
            onChange={changeSectionGroup}
          />
          <SelectFilter
            label="Course Name"
            value={selection.courseNumber}
            placeholder="Select course name"
            options={courseOptions.map((section) => ({ value: section.courseNumber, label: section.courseName }))}
            disabled={!selection.sectionGroup || loadingSections}
            onChange={changeCourse}
          />
          <SelectFilter
            label="Teacher"
            value={selection.teacherId}
            placeholder="Select teacher"
            options={teacherOptions.map((section) => ({ value: section.teacherId, label: section.teacherName }))}
            disabled={!selection.sectionGroup || loadingSections || Boolean(context?.teacherLockedToSignedInUser)}
            onChange={changeTeacher}
          />
          {students.length > 0 ? (
            <SelectFilter
              label="Student"
              value={selection.studentId}
              placeholder="Select student"
              options={students.map((student) => ({ value: student.id, label: student.name }))}
              onChange={selectStudent}
            />
          ) : null}
        </div>

        <div className="assessment-filter-footer">
          <div className="assessment-live-selection">
            <Search size={14} />
            <span>{describeSelection(selection, context, sections, students)}</span>
          </div>
          <button type="button" className="assessment-reset" onClick={reset}>
            <RotateCcw size={14} /> Reset filters
          </button>
        </div>
      </section>

      {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}

      <section className={`assessment-results card${!loadingStudents && selectedSectionId && students.length > 0 ? ' with-student-roster' : ''}${selectedStudent ? ' with-selected-student' : ''}`}>
        <div className="assessment-results-heading">
          <div>
            <span className="eyebrow">Teacher sections</span>
            <h2>{selectedSection ? `${selectedSection.courseName} · ${selectedSection.teacherName}` : 'Available sections'}</h2>
            <p>{selectedSection ? `${students.length} assigned students loaded from Dataverse.` : 'Select a teacher section to load its current student roster.'}</p>
          </div>
          <div className="assessment-result-count"><UsersRound size={16} />{visibleSections.length} sections</div>
        </div>

        {loadingSectionGroups && !selection.sectionGroup ? (
          <div className="assessment-empty">Loading available Section Groups…</div>
        ) : loadingSections ? (
          <div className="assessment-empty">Loading sections…</div>
        ) : !selection.schoolId ? (
          <AssessmentEmpty icon={School} text="Select a school to begin." />
        ) : !selection.sectionGroup ? (
          <AssessmentEmpty icon={Search} text="Select a Section Group to load its Class Assignments." />
        ) : courseGroups.length === 0 ? (
          <AssessmentEmpty icon={Search} text="No teacher sections match the current filters." />
        ) : (
          <div className="teacher-section-groups">
            {courseGroups.map((group) => (
              <div className="teacher-section-group" key={`${group[0].courseNumber}|${group[0].courseName}`}>
                <div className="teacher-section-course">
                  <GraduationCap size={17} />
                  <div>
                    <strong>{group[0].courseName}</strong>
                    <span>{group[0].sectionGroup} · {group[0].courseNumber}</span>
                  </div>
                </div>
                <div className="teacher-section-list">
                  {group.map((section) => (
                    <button
                      type="button"
                      className={selectedSectionId === section.id ? 'teacher-section-button selected' : 'teacher-section-button'}
                      aria-pressed={selectedSectionId === section.id}
                      onClick={() => chooseSection(section)}
                      key={section.id}
                    >
                      <span className="teacher-section-icon"><UserRound size={16} /></span>
                      <span className="teacher-section-copy">
                        <strong>{section.teacherName}</strong>
                        <small>{section.studentCount} students</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {loadingStudents ? <div className="assessment-student-loading">Loading assigned students…</div> : null}
        {!loadingStudents && selectedSectionId && students.length > 0 ? (
          <div className="student-roster">
            <div className="student-roster-heading">
              <div>
                <span className="eyebrow">Assigned students</span>
                <h3>{selectedSection?.teacherName}</h3>
              </div>
              <div className="student-roster-actions">
                <span>{selectedStudent ? `1 of ${students.length} students` : `${students.length} students`}</span>
                {selectedStudent ? (
                  <button type="button" onClick={() => selectStudent('')}>
                    <ListRestart size={14} /> Back to class list
                  </button>
                ) : null}
              </div>
            </div>
            <div className="student-card-grid">
              {students
                .filter((student) => !selection.studentId || student.id === selection.studentId)
                .map((student) => (
                  <StudentCard
                    student={student}
                    selected={student.id === selection.studentId}
                    onSelect={() => selectStudent(student.id)}
                    key={student.studentSectionId}
                  />
                ))}
            </div>
          </div>
        ) : null}
      </section>

      {selectedStudent ? (
        <StudentAssessmentPanel
          student={selectedStudent}
          currentSchoolYear={currentSchoolYear}
          focusArea={selection.sectionGroup}
          teacherSectionId={selectedSectionId}
          onClear={() => selectStudent('')}
        />
      ) : null}
    </div>
  )
}

function SelectFilter({ label, value, placeholder, options, disabled = false, onChange }: {
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="assessment-select-filter">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function AssessmentEmpty({ icon: Icon, text }: { icon: typeof School; text: string }) {
  return <div className="assessment-empty"><Icon size={24} /><span>{text}</span></div>
}

function StudentCard({ student, selected, onSelect }: {
  student: Student
  selected: boolean
  onSelect: () => void
}) {
  return (
    <article
      className={`student-card interactive${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${student.name}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="student-card-heading">
        <div><strong>{student.name}</strong><span>{student.grade ?? 'Grade not recorded'}</span></div>
      </div>
      <dl>
        <div><dt>ASN</dt><dd>{student.asn ?? 'Not recorded'}</dd></div>
        <div><dt>Date of birth</dt><dd>{formatDate(student.dateOfBirth)}</dd></div>
        <div><dt>Gender</dt><dd>{student.gender ?? 'Not recorded'}</dd></div>
        <div><dt>SPED</dt><dd>{student.spedCategory ?? student.spedSeries ?? 'Not coded'}</dd></div>
      </dl>
    </article>
  )
}

function StudentAssessmentPanel({ student, currentSchoolYear, focusArea, teacherSectionId, onClear }: {
  student: Student
  currentSchoolYear?: string
  focusArea: string
  teacherSectionId: string
  onClear: () => void
}) {
  const [yearView, setYearView] = useState<'current' | 'previous'>('current')
  const [tosrecHistory, setTosrecHistory] = useState<AssessmentHistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyNeedsReconnect, setHistoryNeedsReconnect] = useState(false)
  const tosrecVisible = focusArea === 'Literacy' || focusArea === 'Foundations'

  useEffect(() => {
    setYearView('current')
  }, [student.id])

  useEffect(() => {
    let cancelled = false
    setTosrecHistory([])
    setHistoryError(null)
    setHistoryNeedsReconnect(false)
    if (!tosrecVisible || !teacherSectionId) return

    setLoadingHistory(true)
    getJson<AssessmentHistoryRecord[]>(
      `/api/assessments/teacher-sections/${teacherSectionId}/students/${student.id}/history/tosrec`,
    )
      .then((records) => {
        if (!cancelled) setTosrecHistory(records)
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setHistoryError(requestError.message)
          setHistoryNeedsReconnect(requestError instanceof ApiRequestError && requestError.status === 401)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })

    return () => { cancelled = true }
  }, [student.id, teacherSectionId, tosrecVisible])

  const visibleTosrecHistory = tosrecHistory.filter((record) => yearView === 'current'
    ? record.schoolYear === currentSchoolYear
    : record.schoolYear !== currentSchoolYear)

  return (
    <section className="student-assessment-panel card" aria-labelledby="student-assessment-heading">
      <div className="student-assessment-heading">
        <div>
          <span className="eyebrow">Student assessments</span>
          <h2 id="student-assessment-heading">{student.name}</h2>
          <p>Assessment history will be grouped by assessment type and focus area.</p>
        </div>
        <div className="student-assessment-actions">
          <button type="button" onClick={onClear}>
            <ListRestart size={14} /> Back to class list
          </button>
        </div>
      </div>

      <div className="assessment-history-toolbar">
        <div className="assessment-year-tabs" role="tablist" aria-label="Assessment school years">
          <button
            type="button"
            role="tab"
            aria-selected={yearView === 'current'}
            className={yearView === 'current' ? 'active' : ''}
            onClick={() => setYearView('current')}
          >
            Current Year
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={yearView === 'previous'}
            className={yearView === 'previous' ? 'active' : ''}
            onClick={() => setYearView('previous')}
          >
            Previous Years
          </button>
        </div>
        <span className="assessment-focus-context">{focusArea || 'Other'} assessments</span>
      </div>

      {!tosrecVisible ? (
        <AssessmentHistoryEmpty text={`No Literacy or Numeracy assessment groups are mapped to ${focusArea || 'this section group'} yet.`} />
      ) : loadingHistory ? (
        <div className="assessment-history-loading">Loading TOSREC history from Dataverse…</div>
      ) : historyNeedsReconnect ? (
        <div className="assessment-history-reconnect">
          <BookOpenCheck size={24} />
          <div>
            <strong>Reconnect Microsoft services</strong>
            <span>Your FVSD sign-in is valid, but the delegated Dataverse session needs to be refreshed.</span>
          </div>
          <a href="/api/auth/signin">Reconnect</a>
        </div>
      ) : historyError ? (
        <div className="error-banner"><CircleAlert size={18} />{historyError}</div>
      ) : (
        <section className="assessment-history-group" aria-labelledby="tosrec-history-heading">
          <div className="assessment-history-group-heading">
            <div>
              <span className="eyebrow">Literacy</span>
              <h3 id="tosrec-history-heading">TOSREC</h3>
            </div>
            <span>{visibleTosrecHistory.length} records</span>
          </div>
          {visibleTosrecHistory.length > 0 ? (
            <div className="assessment-history-list">
              {visibleTosrecHistory.map((record) => (
                <article className="assessment-history-record" key={record.id}>
                  <div><span>School year</span><strong>{record.schoolYear}</strong></div>
                  <div><span>Period</span><strong>{record.period}</strong></div>
                  <div><span>Standard score</span><strong>{record.exempt ? 'Exempt' : record.standardScore ?? '—'}</strong></div>
                  <div className="assessment-history-term">
                    <span>Descriptive term</span>
                    <strong style={{
                      backgroundColor: record.descriptiveTermFill || '#eef2f5',
                      color: record.descriptiveTermFont || '#29465d',
                    }}>
                      {record.descriptiveTerm}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AssessmentHistoryEmpty text={`No TOSREC records were found for ${yearView === 'current' ? currentSchoolYear || 'the current year' : 'previous years'}.`} />
          )}
        </section>
      )}
    </section>
  )
}

function AssessmentHistoryEmpty({ text }: { text: string }) {
  return (
    <div className="student-assessment-placeholder">
      <BookOpenCheck size={24} />
      <div><strong>Assessment history</strong><span>{text}</span></div>
    </div>
  )
}

function describeSelection(
  selection: Selection,
  context: WorkspaceContext | null,
  sections: TeacherSection[],
  students: Student[],
) {
  const school = context?.schools.find((option) => option.id === selection.schoolId)?.name
  const course = sections.find((section) => section.courseNumber === selection.courseNumber)?.courseName
  const teacher = sections.find((section) => section.teacherId === selection.teacherId)?.teacherName
  const student = students.find((row) => row.id === selection.studentId)?.name
  return [school, selection.sectionGroup, course, teacher, student].filter(Boolean).join(' / ') || 'Choose a school to begin'
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = getKey(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function compareSections(left: TeacherSection, right: TeacherSection) {
  return left.sortOrder - right.sortOrder || left.courseName.localeCompare(right.courseName)
}

function formatDate(value?: string) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value))
}
