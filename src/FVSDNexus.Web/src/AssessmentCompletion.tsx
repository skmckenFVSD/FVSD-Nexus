import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

type MissingStudent = { id: string; name: string; obfuscatedName?: string; asn?: string; obfuscatedAsn?: string; grade?: string }
type Period = { period: number; label: string; expected: number; completed: number; missing: MissingStudent[] }
type Summary = { assessmentType: string; schoolYear: string; refreshedAt: string; periods: Period[]; rosterCount: number; rosterGrades: { grade: string; students: number }[] }

export function AssessmentCompletion({ schoolId, sectionGroup, courseNumber, teacherId, studentDisplayMode, currentSchoolYear }: {
  schoolId: string; sectionGroup: string; courseNumber: string; teacherId: string
  studentDisplayMode: 'real' | 'obfuscated'; currentSchoolYear?: string
}) {
  const [result, setResult] = useState<{ key: string; data: Summary } | null>(null)
  const [error, setError] = useState('')
  const [reconnect, setReconnect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [periodId, setPeriodId] = useState(1)
  const query = new URLSearchParams({ schoolId, sectionGroup })
  if (courseNumber) query.set('courseNumber', courseNumber)
  if (teacherId) query.set('teacherId', teacherId)
  const queryKey = query.toString()

  useEffect(() => {
    const controller = new AbortController()
    setResult(null)
    setError('')
    setReconnect(false)
    if (!schoolId || !sectionGroup) { setLoading(false); return }
    setLoading(true)
    async function load() {
      try {
        const response = await fetch(`/api/assessments/completion/tosrec?${queryKey}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) {
          if (response.status === 401) setReconnect(true)
          const problem = await response.json().catch(() => ({}))
          throw new Error(problem.title || problem.error || 'Unable to load completion counts. Please refresh to try again.')
        }
        const data: Summary = await response.json()
        if (!controller.signal.aborted) setResult({ key: queryKey, data })
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load completion counts.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [schoolId, sectionGroup, queryKey, refresh])

  const data = result?.key === queryKey ? result.data : null
  const selectedPeriod = data?.periods.find(period => period.period === periodId)
  const name = (student: MissingStudent) => studentDisplayMode === 'obfuscated'
    ? student.obfuscatedName?.trim() || 'Obfuscated name unavailable' : student.name
  const asn = (student: MissingStudent) => studentDisplayMode === 'obfuscated'
    ? student.obfuscatedAsn?.trim() || 'Obfuscated ASN unavailable' : student.asn || 'Not recorded'

  return <section className="completion-panel card" aria-labelledby="completion-title" aria-busy={loading}>
    <div className="student-assessment-heading">
      <div>
        <h2 id="completion-title">TOSREC Completion · {data?.schoolYear ?? currentSchoolYear}</h2>
        <p>Grades 2–10: all periods · ELALIT1: Winter and Spring · ELA: not required. Exempt records count as complete.</p>
      </div>
      <button className="assessment-reset" type="button" disabled={loading || !schoolId || !sectionGroup} onClick={() => setRefresh(value => value + 1)}>
        <RotateCcw size={14} /> {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
    {!schoolId || !sectionGroup ? <p className="assessment-empty">Select a school and section group to review completion.</p>
      : loading ? <p role="status" className="assessment-empty">Loading current completion from Dataverse…</p>
      : error ? <div role="alert" className="error-banner">{error} {reconnect ? <a href="/api/auth/signin">Reconnect Microsoft services</a> : null}</div>
      : data ? <>
        <p className="completion-freshness">Last refreshed {new Date(data.refreshedAt).toLocaleTimeString()} · Current class membership; prior-teacher submissions count.</p>
        <p className="completion-freshness">{data.rosterCount} students in the filtered roster · {Math.max(...data.periods.map(period => period.expected))} eligible for TOSREC in at least one period.
          {data.rosterGrades?.length ? ` ${data.rosterGrades.map(group => `${group.grade}: ${group.students}`).join(' · ')}` : ''}</p>
        <div className="completion-periods" aria-label="Assessment periods">
          {data.periods.map(period => <button key={period.period} type="button" className={`completion-period${periodId === period.period ? ' selected' : ''}`}
            aria-pressed={periodId === period.period} onClick={() => setPeriodId(period.period)}>
            <strong>{period.label}</strong>
            {period.expected > 0 ? <>
              <span className="completion-count">{period.completed} <small>of {period.expected} complete</small></span>
              <progress max={period.expected} value={period.completed} aria-label={`${period.label} completion`} />
            </> : <span>{data.rosterCount > 0 ? 'Not required for this roster' : 'No matching students'}</span>}
            <span>{period.expected === 0 ? 'No assessments required' : `${period.missing.length} missing · ${Math.round(period.completed / period.expected * 100)}% complete`}</span>
          </button>)}
        </div>
        {selectedPeriod ? <section className="completion-missing" aria-labelledby="missing-title">
          <h3 id="missing-title">{selectedPeriod.label} · Missing students ({selectedPeriod.missing.length})</h3>
          {selectedPeriod.expected === 0 ? <p>{data.rosterCount > 0
            ? 'No TOSREC assessments are required for this roster in the selected period. ELALIT1 requires Winter and Spring only; ELA has no requirement.'
            : 'No students were found for this course and teacher combination.'}</p>
            : selectedPeriod.missing.length === 0 ? <p>All eligible students have a TOSREC record for {selectedPeriod.label}.</p>
            : <div className="student-card-grid">{[...selectedPeriod.missing].sort((a, b) => name(a).localeCompare(name(b))).map(student =>
              <article className="selected-student-summary" key={student.id}>
                <strong>{name(student)}</strong><span>{student.grade}</span><span>ASN: {asn(student)}</span>
              </article>)}</div>}
        </section> : null}
      </> : null}
  </section>
}
