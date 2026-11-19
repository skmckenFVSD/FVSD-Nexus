import { useEffect, useRef, useState } from 'react'
import { overviewColour, type EmpowerGoal, type EmpowerRating } from './empowerClassOverviewModel'

type Props = {
  editing: boolean; canEdit: boolean; studentName: string; cellKey: string;
  goal: EmpowerGoal; result?: EmpowerGoal; levels: EmpowerRating[];
  onSave: (goal: EmpowerGoal, levelId: string, date: string) => Promise<EmpowerGoal>;
  onPendingChange: (key: string, pending: boolean) => void
}
function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-')
}
function displayDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}
export function ClassOverviewGoalCell({ editing, canEdit, studentName, cellKey, goal, result, levels, onSave, onPendingChange }: Props) {
  const [levelId, setLevelId] = useState(result?.currentLevelId ?? '')
  const [date, setDate] = useState(result?.currentDate?.slice(0, 10) ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'incomplete' | 'error'>('idle')
  const [error, setError] = useState('')
  const saving = useRef(false)
  useEffect(() => {
    setLevelId(result?.currentLevelId ?? '')
    setDate(result?.currentDate?.slice(0, 10) ?? '')
  }, [result?.currentLevelId, result?.currentDate, result?.eTag])
  const commit = async (nextLevel: string, nextDate: string) => {
    if (saving.current) return
    setLevelId(nextLevel)
    setDate(nextDate)
    setError('')
    onPendingChange(cellKey, true)
    if (!levels.some((level) => level.id === nextLevel) || !nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      setStatus('incomplete')
      return
    }
    saving.current = true
    setStatus('saving')
    try {
      const updated = await onSave({ ...goal, ...result }, nextLevel, nextDate)
      setLevelId(updated.currentLevelId ?? nextLevel)
      setDate(updated.currentDate?.slice(0, 10) ?? nextDate)
      setStatus('saved')
      onPendingChange(cellKey, false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The result could not be saved.')
      setStatus('error')
    } finally { saving.current = false }
  }
  const reset = () => {
    setLevelId(result?.currentLevelId ?? '')
    setDate(result?.currentDate?.slice(0, 10) ?? '')
    setStatus('idle')
    setError('')
    onPendingChange(cellKey, false)
  }
  const level = levels.find((item) => item.id === result?.currentLevelId)
  const name = result?.currentLevelName || level?.name
  const readout = <div className={editing && canEdit ? 'hd-class-grid__print-value' : undefined}>
    <span className="hd-empower-overview__rating" style={{ backgroundColor: overviewColour(result?.currentLevelFillHex || level?.fillHex, '#f1f5f9'), color: overviewColour(result?.currentLevelFontHex || level?.fontHex, '#071940') }}>{name || '—'}</span><small>{displayDate(result?.currentDate)}</small>
  </div>
  return <td>
    {readout}
    {editing && canEdit ? <div className="hd-class-grid__cell-editor" aria-busy={status === 'saving'}>
      <select aria-label={`${studentName}: ${goal.name} current level`} value={levelId} disabled={status === 'saving'} onChange={(event) => void commit(event.target.value, date || today())}>
        <option value="" disabled>Select level</option>
        {levelId && !levels.some((item) => item.id === levelId) ? <option value={levelId} disabled>{result?.currentLevelName || 'Previous level'}</option> : null}
        {levels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <input type="date" aria-label={`${studentName}: ${goal.name} date achieved`} value={date} disabled={status === 'saving'} onChange={(event) => void commit(levelId, event.target.value)} />
      <span className={`hd-class-grid__save-status is-${status}`} role={status === 'error' ? 'alert' : 'status'}>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'incomplete' ? 'Select a level and date to save.' : error}</span>
      {status === 'error' || status === 'incomplete' ? <div className="hd-class-grid__cell-actions">{status === 'error' ? <button type="button" onClick={() => void commit(levelId, date)}>Retry</button> : null}<button type="button" onClick={reset}>Reset cell</button></div> : null}
    </div> : editing && !canEdit ? <small className="hd-class-grid__read-only">Read only · active current-year plan required</small> : null}
  </td>
}
