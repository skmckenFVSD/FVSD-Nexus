import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Download, FileDown, Pencil, Printer, RefreshCw, Upload } from 'lucide-react'
import { Dialog } from './components/ui'
import { ClassOverviewGoalCell } from './ClassOverviewGoalCell'
import { groupEmpowerGoals, overviewColour, saveClassOverviewGoal, type EmpowerOverview, type EmpowerGoal, type ClassOverviewStudent } from './empowerClassOverviewModel'

type Props = {
  open: boolean; onClose: () => void;
  schoolId: string; teacherId: string; teacherName: string; sectionGroup: string; schoolYear: string;
  studentDisplayMode: 'real' | 'obfuscated'
}
export function EmpowerClassOverview({ open, onClose, schoolId, teacherId, teacherName, sectionGroup, schoolYear, studentDisplayMode }: Props) {
  const [data, setData] = useState<EmpowerOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [ippSection, setIppSection] = useState('Empower Reading')
  const [editing, setEditing] = useState(false)
  const [pendingCells, setPendingCells] = useState(() => new Set<string>())
  const [notice, setNotice] = useState('')
  const onPendingChange = useCallback((key: string, pending: boolean) => {
    setPendingCells((current) => {
      if (current.has(key) === pending) return current
      const next = new Set(current)
      if (pending) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])
  const saveGoal = async (row: ClassOverviewStudent, goal: EmpowerGoal, levelId: string, date: string) => {
    const saved = await saveClassOverviewGoal(row, goal, ippSection, levelId, date)
    setData((current) => current ? { ...current, students: current.students.map((student) => student.student.id === row.student.id && student.planId === row.planId
      ? { ...student, results: [...student.results.filter((item) => item.goalId !== saved.goalId), saved] } : student) } : current)
    return saved
  }
  const closeOverview = () => {
    if (pendingCells.size) { setNotice('Finish saving or reset the unsaved cells before closing.'); return }
    setEditing(false)
    setNotice('')
    onClose()
  }
  useEffect(() => {
    if (!open || !teacherId) return
    const controller = new AbortController()
    setData(null)
    setEditing(false)
    setPendingCells(new Set())
    setNotice('')
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ teacherId, schoolYear, ippSection })
    if (schoolId) query.set('schoolId', schoolId)
    if (sectionGroup) query.set('sectionGroup', sectionGroup)
    const load = async () => {
      const response = await fetch(`/api/program-plans/class-overview?${query}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      if (!response.ok) {
        const problem = await response.json().catch(() => null)
        throw new Error(problem?.title ?? problem?.error ?? `${ippSection} overview could not be loaded (${response.status}).`)
      }
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The Class Overview endpoint is unavailable. Restart the local API and retry.')
      const result = await response.json() as EmpowerOverview
      if (!controller.signal.aborted) setData(result)
    }
    load().catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, schoolId, teacherId, sectionGroup, schoolYear, refresh, ippSection])
  const groups = groupEmpowerGoals(data?.goals ?? [])
  const divisions = [...new Set(groups.map((group) => group.division))].map((division) => ({
    name: division, groups: groups.filter((group) => group.division === division),
  }))
  const students = (data?.students ?? []).map((row) => ({ ...row,
    displayName: studentDisplayMode === 'obfuscated' ? row.student.obfuscatedName || 'Student' : row.student.name,
    resultsByGoal: new Map(row.results.map((result) => [result.goalId, result])),
  })).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en', { numeric: true }))

  return <Dialog open={open} onClose={closeOverview} title="Class Overview"
    description={`${teacherName} · ${schoolYear}${sectionGroup ? ` · ${sectionGroup}` : ''} · ${ippSection}`}
    className="hd-empower-overview"
    headerActions={<>
      <button type="button" className="hd-empower-overview__button" aria-pressed={editing} disabled={!data || loading || Boolean(error) || (editing && pendingCells.size > 0)} onClick={() => { setEditing((value) => !value); setNotice('') }}><Pencil aria-hidden="true" /> {editing ? 'Done Editing' : 'Edit'}</button>
      <button type="button" className="hd-empower-overview__button" disabled title="PDF export will be connected to the PDF compiler"><FileDown aria-hidden="true" /> Export</button>
      <button type="button" className="hd-empower-overview__button" disabled={!data || loading || Boolean(error) || pendingCells.size > 0} onClick={() => window.print()}><Printer aria-hidden="true" /> Print</button>
      <button type="button" className="hd-empower-overview__button" disabled title="Excel template export is planned"><Download aria-hidden="true" /> Export Template</button>
      <button type="button" className="hd-empower-overview__button" disabled title="Importing results from an exported Excel template is planned"><Upload aria-hidden="true" /> Import Results</button>
    </>}>
    <div className="hd-class-grid__filters">
      <label><span>IPP Section</span><select disabled={pendingCells.size > 0} value={ippSection} onChange={(event) => { setData(null); setIppSection(event.target.value) }}><option>Empower Reading</option><option>Mathematics</option></select></label>
      <button type="button" className="hd-empower-overview__button" disabled={loading || pendingCells.size > 0} onClick={() => setRefresh((value) => value + 1)}><RefreshCw aria-hidden="true" /> Refresh</button>
    </div>
    {editing ? <p className="hd-class-grid__edit-notice" role="status">Changes save automatically. New level entries use today's date when no achievement date is recorded.{pendingCells.size ? ` ${pendingCells.size} cell(s) saving or awaiting correction.` : ''}</p> : null}
    {notice ? <p className="hd-class-grid__edit-notice" role="status">{notice}</p> : null}
    {loading ? <div className="hd-live-workspace-state" role="status"><RefreshCw aria-hidden="true" />Loading {ippSection} master goals and class results…</div> : null}
    {error ? <div className="hd-live-workspace-state is-error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div> : null}
    {data && !loading && !error ? <>
      <div className="hd-empower-overview__key" aria-label={`${ippSection} rating levels`}>
        {data.levels.map((level) => <div key={level.id} style={{ backgroundColor: overviewColour(level.fillHex, '#edf2f8'), color: overviewColour(level.fontHex, '#071940') }}><strong>{level.name}</strong><span>{level.description}</span></div>)}
      </div>
      <p className="hd-empower-overview__summary">{students.length} students · {data.goals.length} master goals · Current level and date achieved. All students in the selected class scope are included. — indicates no recorded result.</p>
      <div className="hd-empower-overview__scroll" tabIndex={0} role="region" aria-label={`${ippSection} class results by grade and goal group`}>
        {divisions.map((division, divisionIndex) => <section className="hd-empower-overview__division" key={division.name} aria-labelledby={`empower-class-division-${divisionIndex}`}>
          <h3 id={`empower-class-division-${divisionIndex}`}>{division.name}</h3>
          {division.groups.map((group, levelIndex) => <section className="hd-empower-overview__group" key={group.key} aria-labelledby={`empower-class-level-${divisionIndex}-${levelIndex}`}>
          <h4 id={`empower-class-level-${divisionIndex}-${levelIndex}`}>{group.foundationLevel} <small>{group.goals.length} goals</small></h4>
          <table>
            <colgroup><col className="hd-empower-overview__student-column" />{group.goals.map((goal) => <col key={goal.goalId} />)}</colgroup>
            <caption className="hd-empower-overview__caption">{group.division} · {group.foundationLevel}: current {ippSection} results</caption>
            <thead><tr><th scope="col" className="hd-empower-overview__student">Student</th>{group.goals.map((goal) => <th scope="col" key={goal.goalId}><strong>{goal.name}</strong><p>{goal.description || 'No description recorded.'}</p></th>)}</tr></thead>
            <tbody>{students.map((row) => <tr key={row.student.id}>
              <th scope="row" className="hd-empower-overview__student"><strong>{row.displayName}</strong><small>{row.student.grade || 'Grade not recorded'}{!row.planId ? ' · No plan for this year' : ''}</small></th>
              {group.goals.map((goal) => <ClassOverviewGoalCell
                key={goal.goalId}
                cellKey={`${row.student.id}:${row.planId}:${goal.goalId}`}
                editing={editing}
                canEdit={row.canEdit}
                studentName={row.displayName}
                goal={goal}
                result={row.resultsByGoal.get(goal.goalId)}
                levels={data.levels}
                onSave={(selectedGoal, levelId, date) => saveGoal(row, selectedGoal, levelId, date)}
                onPendingChange={onPendingChange}
              />)}
            </tr>)}{!students.length ? <tr><td colSpan={group.goals.length + 1}>No students in the selected class scope.</td></tr> : null}</tbody>
          </table>
          </section>)}
        </section>)}
        {!groups.length ? <p>No {ippSection} master goals are configured for these teacher sections.</p> : null}
      </div>
    </> : null}
  </Dialog>
}
