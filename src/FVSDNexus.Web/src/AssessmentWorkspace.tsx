import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Eye,
  GraduationCap,
  ListRestart,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  School,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
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
  sectionNumber?: string
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

type StudentDisplayMode = 'real' | 'obfuscated'

type AssessmentHistoryRecord = {
  id: string
  assessmentType: string
  recordName: string
  schoolYear: string
  period: string
  periodSortOrder: number
  assessmentDate?: string
  gradeAtAssessment?: string
  chronologicalAge?: string
  curriculum?: string
  schoolAtAssessment?: string
  courseNumber?: string
  courseName?: string
  teacherAtAssessment?: string
  sectionNumber?: string
  totalCorrect?: number
  totalError?: number
  rawScore?: number
  standardScore?: number
  percentileRank?: string
  descriptiveTerm: string
  descriptiveTermFill?: string
  descriptiveTermFont?: string
  exempt: boolean
  exemptReason?: string
  eTag?: string
}

type TosrecReferenceOption = {
  rawScore: number
  standardScore: number
  percentileRank: string
  descriptiveTermId: string
  descriptiveTerm: string
  descriptiveTermFill?: string
  descriptiveTermFont?: string
}

type AssessmentTypeOption = {
  value: string
  enabled: boolean
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
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string } | null
    throw new ApiRequestError(problem?.title ?? `Request failed (${response.status})`, response.status)
  }
  return response.json() as Promise<T>
}

async function sendJson(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<void> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; error?: string } | null
    throw new ApiRequestError(problem?.title ?? problem?.error ?? `Request failed (${response.status})`, response.status)
  }
}

async function deleteRecord(url: string, eTag?: string): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: eTag ? { 'If-Match': eTag } : undefined,
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { title?: string; error?: string } | null
    throw new ApiRequestError(problem?.title ?? problem?.error ?? `Request failed (${response.status})`, response.status)
  }
}

class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function AssessmentWorkspace({ currentSchoolYear, studentDisplayMode = 'real' }: {
  currentSchoolYear?: string
  studentDisplayMode?: StudentDisplayMode
}) {
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
  const displayStudents = useMemo(() => [...students].sort((left, right) =>
    getStudentDisplayName(left, studentDisplayMode).localeCompare(getStudentDisplayName(right, studentDisplayMode))),
  [students, studentDisplayMode])

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
          <div className="assessment-role-badge"><BookOpenCheck size={15} />{context?.role === 'Class Room Support' ? 'Classroom Support' : context?.role}</div>
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
              options={displayStudents.map((student) => ({
                value: student.id,
                label: getStudentDisplayName(student, studentDisplayMode),
              }))}
              onChange={selectStudent}
            />
          ) : null}
        </div>

        <div className="assessment-filter-footer">
          <div className="assessment-live-selection">
            <Search size={14} />
            <span>{describeSelection(selection, context, sections, students, studentDisplayMode)}</span>
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
              {displayStudents
                .filter((student) => !selection.studentId || student.id === selection.studentId)
                .map((student) => (
                  <StudentCard
                    student={student}
                    studentDisplayMode={studentDisplayMode}
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
          studentDisplayMode={studentDisplayMode}
          currentSchoolYear={currentSchoolYear}
          focusArea={selection.sectionGroup}
          teacherSectionId={selectedSectionId}
          teacherSection={selectedSection}
          role={context?.role ?? ''}
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

function StudentCard({ student, studentDisplayMode, selected, onSelect }: {
  student: Student
  studentDisplayMode: StudentDisplayMode
  selected: boolean
  onSelect: () => void
}) {
  const studentName = getStudentDisplayName(student, studentDisplayMode)
  const studentAsn = getStudentDisplayAsn(student, studentDisplayMode)

  return (
    <article
      className={`student-card interactive${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${studentName}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="student-card-heading">
        <div><strong>{studentName}</strong><span>{student.grade ?? 'Grade not recorded'}</span></div>
      </div>
      <dl>
        <div><dt>ASN</dt><dd>{studentAsn}</dd></div>
        <div><dt>Date of birth</dt><dd>{formatDate(student.dateOfBirth)}</dd></div>
        <div><dt>Gender</dt><dd>{student.gender ?? 'Not recorded'}</dd></div>
        <div><dt>SPED</dt><dd>{student.spedCategory ?? student.spedSeries ?? 'Not coded'}</dd></div>
      </dl>
    </article>
  )
}

function StudentAssessmentPanel({ student, studentDisplayMode, currentSchoolYear, focusArea, teacherSectionId, teacherSection, role, onClear }: {
  student: Student
  studentDisplayMode: StudentDisplayMode
  currentSchoolYear?: string
  focusArea: string
  teacherSectionId: string
  teacherSection?: TeacherSection
  role: string
  onClear: () => void
}) {
  const [yearView, setYearView] = useState<'current' | 'previous'>('current')
  const [tosrecHistory, setTosrecHistory] = useState<AssessmentHistoryRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyNeedsReconnect, setHistoryNeedsReconnect] = useState(false)
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AssessmentHistoryRecord | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const tosrecVisible = focusArea === 'Literacy' || focusArea === 'Foundations'
  const canDeleteAssessments = role === 'Administrator' || role === 'Data Analyst'

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
  }, [student.id, teacherSectionId, tosrecVisible, historyRefreshKey])

  const visibleTosrecHistory = tosrecHistory.filter((record) => yearView === 'current'
    ? record.schoolYear === currentSchoolYear
    : record.schoolYear !== currentSchoolYear)

  return (
    <section className="student-assessment-panel card" aria-labelledby="student-assessment-heading">
      <div className="student-assessment-heading">
        <div>
          <span className="eyebrow">Student assessments</span>
          <h2 id="student-assessment-heading">{getStudentDisplayName(student, studentDisplayMode)}</h2>
          <p>Assessment history will be grouped by assessment type and focus area.</p>
        </div>
        <div className="student-assessment-actions">
          <button
            type="button"
            className="assessment-add-button"
            onClick={() => {
              setEditingRecord(null)
              setAssessmentModalOpen(true)
              setSaveNotice(null)
            }}
          >
            <Plus size={14} /> Add assessment
          </button>
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

      {saveNotice ? <div className="assessment-save-notice"><CheckCircle2 size={17} />{saveNotice}</div> : null}

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
                  <button
                    type="button"
                    className="assessment-edit-button"
                    aria-label={`View ${record.assessmentType} ${record.period} assessment`}
                    onClick={() => {
                      setEditingRecord(record)
                      setAssessmentModalOpen(true)
                      setSaveNotice(null)
                    }}
                  >
                    <Eye size={13} /> View
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <AssessmentHistoryEmpty text={`No TOSREC records were found for ${yearView === 'current' ? currentSchoolYear || 'the current year' : 'previous years'}.`} />
          )}
        </section>
      )}

      {assessmentModalOpen && teacherSection ? (
        <AssessmentEntryModal
          student={student}
          studentDisplayMode={studentDisplayMode}
          teacherSection={teacherSection}
          focusArea={focusArea}
          currentSchoolYear={currentSchoolYear ?? ''}
          existingRecord={editingRecord}
          canDeleteAssessment={canDeleteAssessments}
          onClose={() => {
            setAssessmentModalOpen(false)
            setEditingRecord(null)
          }}
          onSaved={() => {
            const wasEditing = Boolean(editingRecord)
            setLoadingHistory(true)
            setHistoryError(null)
            setHistoryNeedsReconnect(false)
            setAssessmentModalOpen(false)
            setEditingRecord(null)
            if (!wasEditing) setYearView('current')
            setSaveNotice(wasEditing ? 'TOSREC assessment updated.' : 'TOSREC assessment added.')
            setHistoryRefreshKey((value) => value + 1)
          }}
          onDeleted={() => {
            setLoadingHistory(true)
            setHistoryError(null)
            setHistoryNeedsReconnect(false)
            setAssessmentModalOpen(false)
            setEditingRecord(null)
            setSaveNotice('TOSREC assessment deleted.')
            setHistoryRefreshKey((value) => value + 1)
          }}
        />
      ) : null}
    </section>
  )
}

function AssessmentEntryModal({
  student,
  studentDisplayMode,
  teacherSection,
  focusArea,
  currentSchoolYear,
  existingRecord,
  canDeleteAssessment,
  onClose,
  onSaved,
  onDeleted,
}: {
  student: Student
  studentDisplayMode: StudentDisplayMode
  teacherSection: TeacherSection
  focusArea: string
  currentSchoolYear: string
  existingRecord: AssessmentHistoryRecord | null
  canDeleteAssessment: boolean
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const keepEditingRef = useRef<HTMLButtonElement>(null)
  const discardChangesRef = useRef<HTMLButtonElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)
  const assessmentTypes = useMemo(
    () => getAssessmentTypeOptions(student.grade, focusArea),
    [student.grade, focusArea],
  )
  const initialValues = useMemo(() => ({
    assessmentType: existingRecord?.assessmentType ?? '',
    assessmentDate: toDateInputValue(existingRecord?.assessmentDate),
    period: getPeriodValue(existingRecord?.period)?.toString() ?? '',
    exempt: existingRecord ? (existingRecord.exempt ? 'yes' : 'no') : '',
    exemptReason: existingRecord?.exemptReason ?? '',
    totalCorrect: existingRecord?.totalCorrect?.toString() ?? '',
    totalError: existingRecord?.totalError?.toString() ?? '',
  }), [existingRecord])
  const [assessmentType, setAssessmentType] = useState(initialValues.assessmentType)
  const [assessmentDate, setAssessmentDate] = useState(initialValues.assessmentDate)
  const [period, setPeriod] = useState(initialValues.period)
  const [exempt, setExempt] = useState(initialValues.exempt)
  const [exemptReason, setExemptReason] = useState(initialValues.exemptReason)
  const [totalCorrect, setTotalCorrect] = useState(initialValues.totalCorrect)
  const [totalError, setTotalError] = useState(initialValues.totalError)
  const [references, setReferences] = useState<TosrecReferenceOption[]>([])
  const [loadingReferences, setLoadingReferences] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formMode, setFormMode] = useState<'new' | 'view' | 'edit'>(existingRecord ? 'view' : 'new')
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isReadOnly = formMode === 'view'
  const existingRecordEditable = Boolean(
    existingRecord
    && existingRecord.schoolYear === currentSchoolYear
    && existingRecord.period === getCurrentPeriod()?.label,
  )
  const assessmentDatePeriod = getAssessmentPeriodForDate(assessmentDate)
  const availablePeriodOptions = assessmentDatePeriod
    ? assessmentPeriodOptions.filter((option) => option.value === assessmentDatePeriod)
    : []
  const isExempt = exempt === 'yes'
  const schoolYear = existingRecord?.schoolYear || currentSchoolYear
  const chronologicalAge = calculateChronologicalAge(student.dateOfBirth, assessmentDate)
  const curriculum = assessmentType ? getAssessmentCurriculum(assessmentType) : ''
  const schoolAtAssessment = existingRecord?.schoolAtAssessment || teacherSection.schoolName
  const gradeAtAssessment = existingRecord?.gradeAtAssessment || student.grade || ''
  const courseNumber = existingRecord?.courseNumber || teacherSection.courseNumber
  const courseName = existingRecord?.courseName || teacherSection.courseName
  const teacherAtAssessment = existingRecord?.teacherAtAssessment || teacherSection.teacherName
  const assessmentDetailsComplete = Boolean(
    assessmentType
    && assessmentDate
    && period
    && Number(period) === assessmentDatePeriod
    && exempt
    && (!isExempt || exemptReason.trim()),
  )
  const assessmentSnapshotComplete = Boolean(
    assessmentDetailsComplete
    && chronologicalAge
    && curriculum
    && schoolAtAssessment
    && gradeAtAssessment
    && schoolYear
    && courseNumber
    && courseName
    && teacherAtAssessment,
  )
  const scoringComplete = isExempt || (totalCorrect !== '' && totalError !== '')
  const rawScore = scoringComplete && !isExempt
    ? Math.max(0, Number(totalCorrect) - Number(totalError))
    : null
  const score = rawScore === null
    ? null
    : references.find((option) => option.rawScore === rawScore) ?? null
  const formSnapshot = JSON.stringify({ assessmentType, assessmentDate, period, exempt, exemptReason, totalCorrect, totalError })
  const initialSnapshot = JSON.stringify(initialValues)
  const isDirty = formSnapshot !== initialSnapshot
  const canSave = assessmentType === 'TOSREC'
    && !isReadOnly
    && assessmentSnapshotComplete
    && scoringComplete
    && (isExempt || Boolean(score))
    && !loadingReferences
    && !saving

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog?.open) dialog.close()
    }
  }, [])

  useEffect(() => {
    if (discardConfirmOpen) keepEditingRef.current?.focus()
  }, [discardConfirmOpen])

  useEffect(() => {
    if (deleteConfirmOpen) cancelDeleteRef.current?.focus()
  }, [deleteConfirmOpen])

  useEffect(() => {
    let cancelled = false
    setReferences([])
    setReferenceError(null)
    if (assessmentType !== 'TOSREC' || !assessmentDetailsComplete || isExempt || !period) return

    setLoadingReferences(true)
    getJson<TosrecReferenceOption[]>(
      `/api/assessments/teacher-sections/${teacherSection.id}/students/${student.id}/entry/tosrec/references?period=${period}`,
    )
      .then((options) => {
        if (!cancelled) setReferences(options)
      })
      .catch((requestError: Error) => {
        if (!cancelled) setReferenceError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingReferences(false)
      })
    return () => { cancelled = true }
  }, [assessmentType, isExempt, assessmentDetailsComplete, period, student.id, teacherSection.id])

  const closeImmediately = () => {
    dialogRef.current?.close()
    onClose()
  }

  const requestClose = () => {
    if (!isReadOnly && isDirty) {
      setDiscardConfirmOpen(true)
      return
    }
    closeImmediately()
  }

  const saveAssessment = async () => {
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    const body = {
      assessmentDate,
      period: Number(period),
      exempt: isExempt,
      exemptReason: isExempt ? exemptReason.trim() : null,
      totalCorrect: isExempt ? null : Number(totalCorrect),
      totalError: isExempt ? null : Number(totalError),
      eTag: existingRecord?.eTag ?? null,
    }
    const baseUrl = `/api/assessments/teacher-sections/${teacherSection.id}/students/${student.id}/entry/tosrec`
    try {
      await sendJson(
        existingRecord ? `${baseUrl}/${existingRecord.id}` : baseUrl,
        existingRecord ? 'PATCH' : 'POST',
        body,
      )
      onSaved()
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : 'The assessment could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAssessment = async () => {
    if (!existingRecord || !canDeleteAssessment || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteRecord(
        `/api/assessments/teacher-sections/${teacherSection.id}/students/${student.id}/entry/tosrec/${existingRecord.id}`,
        existingRecord.eTag,
      )
      onDeleted()
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : 'The assessment could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="assessment-entry-dialog"
      aria-labelledby="assessment-entry-title"
      onCancel={(event) => {
        event.preventDefault()
        if (deleteConfirmOpen && !deleting) setDeleteConfirmOpen(false)
        else if (discardConfirmOpen) setDiscardConfirmOpen(false)
        else requestClose()
      }}
    >
      <div className="assessment-entry-shell">
        <header className="assessment-entry-header">
          <div>
            <span className="eyebrow">Assessment data entry</span>
            <h2 id="assessment-entry-title">
              {formMode === 'new' ? 'Add Student Assessment' : formMode === 'edit' ? 'Edit Student Assessment' : 'View Student Assessment'}
            </h2>
            <p>{getStudentDisplayName(student, studentDisplayMode)} · {student.grade ?? 'Grade not recorded'}</p>
          </div>
          <button type="button" className="assessment-dialog-close" aria-label="Close assessment" onClick={requestClose}>
            <X size={18} />
          </button>
        </header>

        <div className="assessment-entry-content">
          <label className="assessment-type-selector">
            <span>Assessment Type</span>
            <select
              value={assessmentType}
              disabled={Boolean(existingRecord) || isReadOnly}
              autoFocus={!existingRecord}
              onChange={(event) => {
                setAssessmentType(event.target.value)
                setTotalCorrect('')
                setTotalError('')
                setReferences([])
              }}
            >
              <option value="">Select Assessment Type</option>
              {assessmentTypes.map((option) => (
                <option value={option.value} disabled={!option.enabled} key={option.value}>
                  {option.value}{option.enabled ? '' : ' — scoring form not yet connected'}
                </option>
              ))}
            </select>
            <small>Filtered by Student Curriculum and Grade</small>
          </label>

          {assessmentType ? <section className="assessment-form-section" aria-labelledby="assessment-master-heading">
            <div className="assessment-form-section-heading">
              <div>
                <h3 id="assessment-master-heading">Assessment Detail</h3>
              </div>
            </div>

            <div className="assessment-master-grid">
              <label className="assessment-form-field">
                <span>Assessment Date <em>Required</em></span>
                <input
                  type="date"
                  value={assessmentDate}
                  disabled={isReadOnly}
                  onChange={(event) => {
                    setAssessmentDate(event.target.value)
                    setPeriod('')
                    setTotalCorrect('')
                    setTotalError('')
                  }}
                />
              </label>
              <label className="assessment-form-field">
                <span>Period <em>Required</em></span>
                <select
                  value={period}
                  disabled={isReadOnly || !assessmentDate}
                  onChange={(event) => {
                    setPeriod(event.target.value)
                    setTotalCorrect('')
                    setTotalError('')
                  }}
                >
                  <option value="">Select period</option>
                  {availablePeriodOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
                {assessmentDate && !assessmentDatePeriod ? <small>No assessment period is available for this date.</small> : null}
              </label>
              <label className="assessment-form-field">
                <span>Exempt <em>Required</em></span>
                <select disabled={isReadOnly} value={exempt} onChange={(event) => setExempt(event.target.value)}>
                  <option value="">Select exempt status</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
              {isExempt ? <label className="assessment-form-field assessment-reason-field">
                <span>Exempt Reason <em>Required</em></span>
                <textarea
                  rows={3}
                  value={exemptReason}
                  disabled={isReadOnly}
                  placeholder="Enter the reason for exemption"
                  onChange={(event) => setExemptReason(event.target.value)}
                />
              </label> : null}
            </div>
          </section> : <div className="assessment-inline-empty">Assessment Type must be selected before continuing</div>}

          {assessmentDetailsComplete && assessmentType === 'TOSREC' && !isExempt ? (
            <section className="assessment-form-section assessment-score-section" aria-labelledby="tosrec-score-heading">
              <div className="assessment-form-section-heading">
                <div>
                  <span className="eyebrow">TOSREC</span>
                  <h3 id="tosrec-score-heading">Assessment Scoring</h3>
                </div>
                {loadingReferences ? <span className="assessment-section-state"><LoaderCircle className="spin" size={14} />Loading reference</span> : null}
              </div>

              {referenceError ? <div className="error-banner"><CircleAlert size={18} />{referenceError}</div> : null}
              {!referenceError && !loadingReferences && references.length === 0 ? (
                <div className="assessment-inline-empty">No TOSREC reference values match this Grade and Period.</div>
              ) : null}
              {references.length > 0 ? (
                <>
                  <div className="assessment-score-inputs">
                    <label className="assessment-form-field">
                      <span>Total Correct <em>Required</em></span>
                      <select disabled={isReadOnly} value={totalCorrect} onChange={(event) => setTotalCorrect(event.target.value)}>
                        <option value="">Select total correct</option>
                        {references.map((option) => <option value={option.rawScore} key={option.rawScore}>{option.rawScore}</option>)}
                      </select>
                    </label>
                    <label className="assessment-form-field">
                      <span>Total Error <em>Required</em></span>
                      <select disabled={isReadOnly} value={totalError} onChange={(event) => setTotalError(event.target.value)}>
                        <option value="">Select total error</option>
                        {references.map((option) => <option value={option.rawScore} key={option.rawScore}>{option.rawScore}</option>)}
                      </select>
                    </label>
                  </div>

                  {scoringComplete ? (
                    <div className="assessment-calculated-results" aria-live="polite">
                      <ReadOnlyAssessmentField label="Raw Score" value={rawScore?.toString() ?? '—'} />
                      <ReadOnlyAssessmentField label="Standard Score" value={score?.standardScore.toString() ?? 'No matching reference'} />
                      <ReadOnlyAssessmentField label="Percentile Rank" value={score?.percentileRank ?? 'No matching reference'} />
                      <div className="assessment-result-field">
                        <span>Descriptive Term</span>
                        <strong style={{
                          backgroundColor: score?.descriptiveTermFill || '#eef2f5',
                          color: score?.descriptiveTermFont || '#29465d',
                        }}>
                          {score?.descriptiveTerm ?? 'No matching reference'}
                        </strong>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : assessmentDetailsComplete && assessmentType === 'TOSREC' && isExempt ? (
            <div className="assessment-exempt-note"><CheckCircle2 size={18} />TOSREC scoring is not required for an exempt assessment.</div>
          ) : assessmentType && assessmentType !== 'TOSREC' ? (
            <div className="assessment-inline-empty">The {assessmentType} scoring form will be connected in a later PoC slice.</div>
          ) : assessmentType ? (
            <div className="assessment-inline-empty">Please complete the Assessment Details before continuing to Assessment Specific Scoring</div>
          ) : null}

          {saveError ? <div className="error-banner"><CircleAlert size={18} />{saveError}</div> : null}
        </div>

        <footer className="assessment-entry-footer">
          <span>{isReadOnly ? 'Viewing the saved assessment record.' : 'Assessment record is not created or updated until Save is selected.'}</span>
          <div>
            <button type="button" className="assessment-cancel-button" onClick={requestClose}>{isReadOnly ? 'Close' : 'Cancel'}</button>
            {isReadOnly && existingRecord && canDeleteAssessment ? (
              <button type="button" className="assessment-delete-button" onClick={() => {
                setDeleteError(null)
                setDeleteConfirmOpen(true)
              }}>
                <Trash2 size={15} /> Delete Assessment
              </button>
            ) : null}
            {isReadOnly && existingRecordEditable ? (
              <button type="button" className="assessment-save-button" onClick={() => {
                setFormMode('edit')
                setSaveError(null)
              }}>
                <Pencil size={15} /> Edit
              </button>
            ) : !isReadOnly ? (
              <button type="button" className="assessment-save-button" disabled={!canSave} onClick={saveAssessment}>
                {saving ? <LoaderCircle className="spin" size={15} /> : <CheckCircle2 size={15} />}
                {saving ? 'Saving…' : 'Save Assessment'}
              </button>
            ) : null}
          </div>
        </footer>

        {discardConfirmOpen ? (
          <div className="assessment-discard-backdrop">
            <section
              className="assessment-discard-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="assessment-discard-title"
              aria-describedby="assessment-discard-description"
              onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                if (event.shiftKey && document.activeElement === keepEditingRef.current) {
                  event.preventDefault()
                  discardChangesRef.current?.focus()
                } else if (!event.shiftKey && document.activeElement === discardChangesRef.current) {
                  event.preventDefault()
                  keepEditingRef.current?.focus()
                }
              }}
            >
              <div className="assessment-discard-heading">
                <span><CircleAlert size={20} /></span>
                <div>
                  <h3 id="assessment-discard-title">Discard unsaved changes?</h3>
                  <p id="assessment-discard-description">Any changes made since opening this assessment will be lost.</p>
                </div>
              </div>
              <div className="assessment-discard-actions">
                <button ref={keepEditingRef} type="button" className="assessment-cancel-button" onClick={() => setDiscardConfirmOpen(false)}>
                  Keep editing
                </button>
                <button ref={discardChangesRef} type="button" className="assessment-discard-button" onClick={closeImmediately}>
                  <Trash2 size={15} /> Discard changes
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {deleteConfirmOpen ? (
          <div className="assessment-discard-backdrop">
            <section
              className="assessment-discard-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="assessment-delete-title"
              aria-describedby="assessment-delete-description"
              onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                if (event.shiftKey && document.activeElement === cancelDeleteRef.current) {
                  event.preventDefault()
                  confirmDeleteRef.current?.focus()
                } else if (!event.shiftKey && document.activeElement === confirmDeleteRef.current) {
                  event.preventDefault()
                  cancelDeleteRef.current?.focus()
                }
              }}
            >
              <div className="assessment-discard-heading">
                <span><Trash2 size={20} /></span>
                <div>
                  <h3 id="assessment-delete-title">Confirm Deletion of Record</h3>
                  <p id="assessment-delete-description">This will permanently delete the TOSREC assessment from Dataverse. This action cannot be undone.</p>
                </div>
              </div>
              {deleteError ? <div className="assessment-delete-error"><CircleAlert size={16} />{deleteError}</div> : null}
              <div className="assessment-discard-actions">
                <button ref={cancelDeleteRef} type="button" className="assessment-cancel-button" disabled={deleting} onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </button>
                <button ref={confirmDeleteRef} type="button" className="assessment-discard-button" disabled={deleting} onClick={deleteAssessment}>
                  {deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
                  {deleting ? 'Deleting…' : 'Delete Assessment'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}

function ReadOnlyAssessmentField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`assessment-readonly-field${wide ? ' wide' : ''}`}>
      <span>{label}</span>
      <strong>{value || 'Not recorded'}</strong>
    </div>
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
  studentDisplayMode: StudentDisplayMode,
) {
  const school = context?.schools.find((option) => option.id === selection.schoolId)?.name
  const course = sections.find((section) => section.courseNumber === selection.courseNumber)?.courseName
  const teacher = sections.find((section) => section.teacherId === selection.teacherId)?.teacherName
  const selectedStudent = students.find((row) => row.id === selection.studentId)
  const student = selectedStudent ? getStudentDisplayName(selectedStudent, studentDisplayMode) : undefined
  return [school, selection.sectionGroup, course, teacher, student].filter(Boolean).join(' / ') || 'Choose a school to begin'
}

function getStudentDisplayName(student: Student, mode: StudentDisplayMode) {
  if (mode === 'obfuscated') return student.obfuscatedName?.trim() || 'Obfuscated name unavailable'
  return student.name
}

function getStudentDisplayAsn(student: Student, mode: StudentDisplayMode) {
  if (mode === 'obfuscated') return student.obfuscatedAsn?.trim() || 'Obfuscated ASN unavailable'
  return student.asn?.trim() || 'Not recorded'
}

const assessmentPeriodOptions = [
  { value: 1, label: 'Fall' },
  { value: 2, label: 'Winter' },
  { value: 3, label: 'Spring' },
]

function getAssessmentTypeOptions(grade: string | undefined, focusArea: string): AssessmentTypeOption[] {
  let choices: string[] = []
  if (grade === 'Kindergarten') {
    if (focusArea === 'Literacy') choices = ['CTOPP', 'LeNS', 'ADLOF']
    if (focusArea === 'Numeracy') choices = ['PNSA']
  } else if (grade === 'Grade 1') {
    choices = focusArea === 'Literacy'
      ? ['CTOPP', 'LeNS', 'TOSREC', 'TOWRE']
      : ['PNSA', 'WRAT-5']
  } else if (grade === 'Grade 2') {
    if (focusArea === 'Literacy') choices = ['LeNS', 'TOSREC', 'TOWRE']
    if (focusArea === 'Numeracy') choices = ['PNSA', 'WRAT-5']
    if (focusArea === 'Foundations') choices = ['LeNS', 'TOSREC', 'TOWRE', 'PNSA', 'WRAT-5']
  } else if (grade === 'Grade 3') {
    if (focusArea === 'Literacy') choices = ['LeNS', 'TOSREC', 'TOSWRF', 'TOWRE']
    if (focusArea === 'Numeracy') choices = ['PNSA', 'WRAT-5']
    if (focusArea === 'Foundations') choices = ['LeNS', 'TOSREC', 'TOSWRF', 'TOWRE', 'PNSA', 'WRAT-5']
  } else {
    if (focusArea === 'Literacy') choices = ['TOSREC', 'TOWRE']
    if (focusArea === 'Numeracy') choices = ['PNSA', 'WRAT-5']
    if (focusArea === 'Foundations') choices = ['LeNS', 'TOSREC', 'TOSWRF', 'TOWRE', 'PNSA', 'WRAT-5']
  }

  return choices.map((value) => ({ value, enabled: value === 'TOSREC' }))
}

function getAssessmentCurriculum(assessmentType: string) {
  return assessmentType === 'WRAT-5' || assessmentType === 'PNSA'
    ? 'Mathematics'
    : 'English Language Arts and Literature'
}

function getCurrentPeriod() {
  const month = new Date().getMonth() + 1
  if (month >= 9) return { value: 1, label: 'Fall' }
  if (month <= 3) return { value: 2, label: 'Winter' }
  if (month <= 6) return { value: 3, label: 'Spring' }
  return null
}

function getPeriodValue(label: string | undefined) {
  return assessmentPeriodOptions.find((option) => option.label === label)?.value
}

function getAssessmentPeriodForDate(value: string) {
  const [, month, day] = value.split('-').map(Number)
  if (!month || !day) return null
  if (month >= 9 && month <= 12) return 1
  if (month === 1 || month === 2 || (month === 3 && day <= 30)) return 2
  if (month >= 4 && month <= 6) return 3
  return null
}

function toDateInputValue(value: string | undefined) {
  return value?.slice(0, 10) ?? ''
}

function calculateChronologicalAge(dateOfBirth: string | undefined, assessmentDate: string) {
  if (!dateOfBirth || !assessmentDate) return ''
  const [birthYear, birthMonth, birthDay] = dateOfBirth.slice(0, 10).split('-').map(Number)
  const [assessmentYear, assessmentMonth, assessmentDay] = assessmentDate.split('-').map(Number)
  if (!birthYear || !birthMonth || !birthDay || !assessmentYear || !assessmentMonth || !assessmentDay) return ''
  const birthValue = birthYear * 10_000 + birthMonth * 100 + birthDay
  const assessmentValue = assessmentYear * 10_000 + assessmentMonth * 100 + assessmentDay
  if (assessmentValue < birthValue) return ''

  const birthdayHasPassed = birthMonth < assessmentMonth
    || (birthMonth === assessmentMonth && birthDay <= assessmentDay)
  const years = assessmentYear - birthYear - (birthdayHasPassed ? 0 : 1)
  const monthDifference = assessmentMonth - birthMonth - (birthDay > assessmentDay ? 1 : 0)
  const months = ((monthDifference % 12) + 12) % 12
  return `${years}-${months}`
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
