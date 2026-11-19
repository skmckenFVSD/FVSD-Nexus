export type EmpowerRating = { id: string; name: string; description: string; fillHex: string; fontHex: string; sortOrder: number }
export type EmpowerGoal = {
  goalId: string; name: string; alias: string; description: string; foundationLevel: string; division: string;
  subsection?: string; sortOrder: number; currentLevelId?: string; currentLevelName?: string;
  currentLevelFillHex?: string; currentLevelFontHex?: string; currentDate?: string; progressId?: string; eTag?: string
}
export type EmpowerOverview = {
  schoolYear: string; levels: EmpowerRating[]; goals: EmpowerGoal[];
  students: Array<{ student: { id: string; name: string; obfuscatedName?: string; grade?: string }; planId?: string; teacherSectionId: string; canEdit: boolean; results: EmpowerGoal[] }>
}

export function groupEmpowerGoals(goals: EmpowerGoal[]) {
  const groups = new Map<string, { key: string; division: string; foundationLevel: string; goals: EmpowerGoal[] }>()
  for (const goal of new Map(goals.map((goal) => [goal.goalId, goal])).values()) {
    const key = JSON.stringify([goal.division, goal.foundationLevel])
    const group = groups.get(key) ?? { key, division: goal.division, foundationLevel: goal.foundationLevel, goals: [] }
    group.goals.push(goal)
    groups.set(key, group)
  }
  const compare = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
  return [...groups.values()].sort((a, b) => compare(a.division, b.division) || compare(a.foundationLevel, b.foundationLevel))
    .map((group) => ({ ...group, goals: group.goals.sort((a, b) => compare(a.subsection ?? '', b.subsection ?? '') || a.sortOrder - b.sortOrder || compare(a.name, b.name)) }))
}

export function overviewColour(value: string | undefined, fallback: string) {
  const hex = value?.replace(/^#/, '') ?? ''
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : fallback
}

export type ClassOverviewStudent = EmpowerOverview['students'][number]

export function classGoalSaveRequest(row: ClassOverviewStudent, goal: EmpowerGoal, ippSection: string, levelId: string, dateAchieved: string) {
  if (!row.canEdit || !row.planId || !row.teacherSectionId) throw new Error('This student needs an active current-year plan before results can be edited.')
  if (!levelId || !/^\d{4}-\d{2}-\d{2}$/.test(dateAchieved)) throw new Error('Select a level and achievement date.')
  const endpoint = ippSection === 'Empower Reading' ? 'empower-reading' : ippSection === 'Mathematics' ? 'mathematics' : null
  if (!endpoint) throw new Error('This IPP section does not support grid editing yet.')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (goal.progressId) {
    if (!goal.eTag) throw new Error('Reset this cell and refresh the grid before changing this result.')
    headers['If-Match'] = goal.eTag
  }
  return {
    url: `/api/class-assignments/teacher-sections/${encodeURIComponent(row.teacherSectionId)}/students/${encodeURIComponent(row.student.id)}/plans/${encodeURIComponent(row.planId)}/${endpoint}/goals/${encodeURIComponent(goal.goalId)}`,
    options: { method: 'PUT', credentials: 'include' as const, cache: 'no-store' as const, headers, body: JSON.stringify({ levelId, dateAchieved }) },
  }
}

export async function saveClassOverviewGoal(row: ClassOverviewStudent, goal: EmpowerGoal, ippSection: string, levelId: string, dateAchieved: string, request: typeof fetch = fetch): Promise<EmpowerGoal> {
  const { url, options } = classGoalSaveRequest(row, goal, ippSection, levelId, dateAchieved)
  const response = await request(url, options)
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    if (response.status === 409 || response.status === 412) throw new Error('This result changed or is no longer editable. Reset this cell and refresh the grid before trying again.')
    throw new Error(problem?.error ?? problem?.title ?? `The result could not be saved (${response.status}).`)
  }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Your Microsoft session needs to be reconnected before results can be saved.')
  const updated = await response.json() as { goals: EmpowerGoal[] }
  const saved = updated.goals.find((item) => item.goalId === goal.goalId)
  if (!saved) throw new Error('The server did not return the saved goal. Reset this cell and refresh the grid.')
  return { ...goal, ...saved, foundationLevel: goal.foundationLevel, division: goal.division }
}
