import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('../src/empowerClassOverviewModel.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { groupEmpowerGoals, overviewColour } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const goal = (goalId, division, foundationLevel, sortOrder, name = 'Shared strategy') => ({ goalId, division, foundationLevel, sortOrder, name, description: '', alias: goalId })
test('groups master goals by division then level without mixing identical goal names', () => {
  const source = [goal('a', 'Grade 6 to 9', 'Level 2', 2), goal('b', 'Grade 2 to 5', 'Level 2', 1), goal('c', 'Grade 6 to 9', 'Level 1', 1), goal('d', 'Grade 6 to 9', 'Level 2', 1)]
  const groups = groupEmpowerGoals(source)
  assert.deepEqual(groups.map((group) => [group.division, group.foundationLevel]), [['Grade 2 to 5', 'Level 2'], ['Grade 6 to 9', 'Level 1'], ['Grade 6 to 9', 'Level 2']])
  assert.deepEqual(groups[2].goals.map((goal) => goal.goalId), ['d', 'a'])
  assert.equal(groups.flatMap((group) => group.goals).length, source.length)
})
test('preserves every master header without requiring student results', () => {
  const goals = Array.from({ length: 75 }, (_, index) => goal(`goal-${index}`, 'Grade 6 to 9', 'Level 2', index))
  assert.equal(groupEmpowerGoals(goals)[0].goals.length, 75)
})
test('deduplicates IDs without merging distinct master goals that share a name', () => {
  const a = goal('a', 'Div 1', 'Level 1', 1)
  assert.deepEqual(groupEmpowerGoals([a, a, goal('b', 'Div 1', 'Level 1', 2)])[0].goals.map((goal) => goal.goalId), ['a', 'b'])
})
test('normalizes Dataverse colours and handles missing or invalid values', () => {
  assert.equal(overviewColour('ccddee', '#ffffff'), '#ccddee')
  assert.equal(overviewColour('#AABBCC', '#ffffff'), '#AABBCC')
  assert.equal(overviewColour(undefined, '#ffffff'), '#ffffff')
  assert.equal(overviewColour('invalid', '#ffffff'), '#ffffff')
})
