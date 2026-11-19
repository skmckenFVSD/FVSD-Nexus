import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('../src/empowerClassOverviewModel.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { classGoalSaveRequest, saveClassOverviewGoal } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const row = { student: { id: 'student-1' }, planId: 'plan-1', teacherSectionId: 'section-1', canEdit: true }
const goal = { goalId: 'goal-1', name: 'Strategy', foundationLevel: 'Level 1', division: 'Grade 2 to 5' }
const body = { levelId: 'level-3', dateAchieved: '2026-11-19' }

test('new result uses scoped upsert with level and date and no fabricated version', () => {
  const result = classGoalSaveRequest(row, goal, 'Empower Reading', body.levelId, body.dateAchieved)
  assert.equal(result.url, '/api/class-assignments/teacher-sections/section-1/students/student-1/plans/plan-1/empower-reading/goals/goal-1')
  assert.equal(result.options.method, 'PUT')
  assert.equal(result.options.credentials, 'include')
  assert.deepEqual(JSON.parse(result.options.body), body)
  assert.equal(result.options.headers['If-Match'], undefined)
})
test('existing result retains its concurrency version and uses the selected IPP section', () => {
  const result = classGoalSaveRequest(row, { ...goal, progressId: 'progress-1', eTag: 'W/"7"' }, 'Mathematics', body.levelId, body.dateAchieved)
  assert.ok(result.url.includes('/mathematics/goals/'))
  assert.equal(result.options.headers['If-Match'], 'W/"7"')
  assert.throws(() => classGoalSaveRequest(row, { ...goal, progressId: 'progress-1' }, 'Mathematics', body.levelId, body.dateAchieved), /refresh/)
})
test('historical plans, missing plans, incomplete fields and unsupported sections cannot send a save', () => {
  for (const invalid of [{ ...row, canEdit: false }, { ...row, planId: null }, { ...row, teacherSectionId: '' }]) {
    assert.throws(() => classGoalSaveRequest(invalid, goal, 'Empower Reading', body.levelId, body.dateAchieved), /active current-year plan/)
  }
  assert.throws(() => classGoalSaveRequest(row, goal, 'Empower Reading', '', body.dateAchieved), /level and achievement date/)
  assert.throws(() => classGoalSaveRequest(row, goal, 'Empower Reading', body.levelId, ''), /level and achievement date/)
  assert.throws(() => classGoalSaveRequest(row, goal, 'Unknown', body.levelId, body.dateAchieved), /does not support/)
})
test('saved response supplies new version without losing the grid grouping metadata', async () => {
  const result = await saveClassOverviewGoal(row, goal, 'Mathematics', body.levelId, body.dateAchieved, async () => Response.json({ goals: [{ goalId: goal.goalId, progressId: 'created-id', eTag: 'W/"8"', currentLevelId: body.levelId, currentDate: body.dateAchieved }] }))
  assert.equal(result.progressId, 'created-id')
  assert.equal(result.eTag, 'W/"8"')
  assert.equal(result.foundationLevel, goal.foundationLevel)
  assert.equal(result.division, goal.division)
})
test('conflicts and access failures are reported without treating the result as saved', async () => {
  for (const status of [409, 412]) {
    await assert.rejects(saveClassOverviewGoal(row, goal, 'Empower Reading', body.levelId, body.dateAchieved, async () => Response.json({}, { status })), /Reset this cell and refresh/)
  }
  await assert.rejects(saveClassOverviewGoal(row, goal, 'Empower Reading', body.levelId, body.dateAchieved, async () => Response.json({ title: 'Outside teacher scope' }, { status: 403 })), /Outside teacher scope/)
})
test('malformed success does not report an unsaved result as saved', async () => {
  await assert.rejects(saveClassOverviewGoal(row, goal, 'Empower Reading', body.levelId, body.dateAchieved, async () => new Response('<html>sign in</html>', { headers: { 'Content-Type': 'text/html' } })), /reconnected/)
  await assert.rejects(saveClassOverviewGoal(row, goal, 'Empower Reading', body.levelId, body.dateAchieved, async () => Response.json({ goals: [] })), /did not return the saved goal/)
})
