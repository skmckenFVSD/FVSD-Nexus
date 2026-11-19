import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/programPlansDashboardModel.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { buildProgramPlansView } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const section = (id, schoolId, sectionGroup, teacherId) => ({ id, schoolId, schoolName: schoolId, sectionGroup, teacherId, teacherName: teacherId, courseName: sectionGroup })
const a = section('a', 'School A', 'Homeroom', 'Teacher A')
const b = section('b', 'School A', 'Foundations', 'Teacher B')
const c = section('c', 'School B', 'Homeroom', 'Teacher C')
const row = (id, statusCode, assignments, schoolYear = '2026 / 2027') => ({
  plan: { id, statusCode, status: 'Unknown', schoolYear },
  student: { id: `student-${id}`, name: `Real ${id}`, obfuscatedName: `Hidden ${id}`, asn: '123', obfuscatedAsn: '999' }, assignments,
})
const duplicate = row('signed', 102370003, [a, b])
const data = { sections: [a, b, c], plans: [duplicate, duplicate, row('draft', 1, [a]), row('review', 102370001, [b]), row('waiting', 102370002, [c]), row('archive', 2, [a]), row('old', 2, [c], '2025-2026')] }
const defaults = { schoolId: '', sectionGroup: '', teacherId: '', schoolYear: '2026 / 2027', status: 'All statuses', audience: 'executive', obfuscated: false }
const view = (filters = {}) => buildProgramPlansView(data, { ...defaults, ...filters })

test('school selection updates every dashboard area and deduplicates plans', () => {
  const result = view({ schoolId: 'School A' })
  assert.deepEqual(result.visibleProgramPlanQueue.map((plan) => plan.id), ['signed', 'draft', 'review', 'archive'])
  assert.equal(result.programPlansView.active, 3)
  assert.equal(result.programPlansView.signed, 1)
  assert.equal(result.programPlansView.rate, 33)
  assert.equal(result.programPlansView.attention, 2)
  assert.equal(result.statusCounts['Awaiting Signatures'], 0)
  assert.equal(result.programPlansView.actions.length, 2)
  assert.deepEqual(result.programPlansView.accountability.map(([teacher]) => teacher), ['Teacher A', 'Teacher B'])
})
test('section and teacher filters intersect on the same membership', () => {
  assert.deepEqual(view({ sectionGroup: 'Foundations', teacherId: 'Teacher B' }).visibleProgramPlanQueue.map((plan) => plan.id), ['signed', 'review'])
  assert.equal(view({ sectionGroup: 'Homeroom', teacherId: 'Teacher B' }).visibleProgramPlanQueue.length, 0)
})
test('status filtering applies to totals, pipeline, actions, accountability and queue', () => {
  const result = view({ status: 'Signed' })
  assert.equal(result.visibleProgramPlanQueue.length, 1)
  assert.equal(result.programPlansView.active, 1)
  assert.equal(result.programPlansView.rate, 100)
  assert.equal(result.programPlansView.attention, 0)
  assert.equal(result.programPlansView.actions.length, 0)
  assert.equal(result.statusCounts.Draft, 0)
  assert.deepEqual(result.programPlansView.accountability, [['School A', '100% signed', 100]])
})
test('previous year includes archived records and handles year separators', () => {
  const result = view({ schoolYear: '2025 / 2026' })
  assert.deepEqual(result.visibleProgramPlanQueue.map((plan) => plan.id), ['old'])
  assert.equal(result.statusCounts.Archived, 1)
  assert.equal(result.programPlansView.active, 0)
  assert.equal(result.programPlansView.rate, 0)
})
test('empty combinations clear all dashboard metrics', () => {
  const result = view({ schoolId: 'School B', teacherId: 'Teacher A' })
  assert.equal(result.visibleProgramPlanQueue.length, 0)
  assert.equal(result.programPlansView.active, 0)
  assert.equal(result.programPlansView.actions.length, 0)
  assert.equal(result.programPlansView.accountability.length, 0)
})
test('obfuscation and opening a plan use its matching permitted assignment', () => {
  const result = view({ teacherId: 'Teacher B', obfuscated: true })
  const plan = result.visibleProgramPlanQueue[0]
  assert.equal(plan.student, 'Hidden signed')
  assert.equal(plan.context.studentName, 'Hidden signed')
  assert.equal(plan.context.studentAsn, '999')
  assert.equal(plan.context.teacherSectionId, 'b')
  assert.equal(plan.context.planId, 'signed')
})
