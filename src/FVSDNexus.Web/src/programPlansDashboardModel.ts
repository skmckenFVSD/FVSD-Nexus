import type { IppPreviewContext } from './IppPreview'

export type ProgramPlanStatus = 'All statuses' | 'Draft' | 'Principal Review' | 'Awaiting Signatures' | 'Signed' | 'Archived'
type LifecycleStatus = Exclude<ProgramPlanStatus, 'All statuses'>
type Section = { id: string; schoolId: string; schoolName: string; sectionGroup: string; teacherId: string; teacherName: string; courseName: string }
type Plan = { id: string; schoolYear: string; gradeAtPlan?: string; schoolAtPlan?: string; teacherAtPlan?: string; statusCode: number; status: string; modifiedOn?: string }
type Student = { id: string; name: string; obfuscatedName?: string; asn?: string; obfuscatedAsn?: string; grade?: string }
export type ProgramPlansData = { schoolYear: string; sections: Section[]; plans: Array<{ plan: Plan; student: Student; assignments: Section[] }> }
type Filters = { schoolId: string; sectionGroup: string; teacherId: string; schoolYear: string; status: ProgramPlanStatus; audience: 'executive' | 'school-admin' | 'teacher'; obfuscated: boolean }
const statuses: Record<number, LifecycleStatus> = { 1: 'Draft', 102370001: 'Principal Review', 102370002: 'Awaiting Signatures', 102370003: 'Signed', 2: 'Archived' }
const percentage = (signed: number, active: number) => active ? Math.round(signed * 100 / active) : 0

export function buildProgramPlansView(data: ProgramPlansData | null, filters: Filters) {
  const matchesSection = (section: Section) => (!filters.schoolId || section.schoolId === filters.schoolId)
    && (!filters.sectionGroup || section.sectionGroup === filters.sectionGroup)
    && (!filters.teacherId || section.teacherId === filters.teacherId)
  // Keep all matching memberships for accountability, but count each plan once in totals and the queue.
  const scoped = [...new Map((data?.plans ?? []).filter((row) => row.plan.schoolYear.replace(/\D/g, '') === filters.schoolYear.replace(/\D/g, ''))
    .map((row) => ({ ...row, assignments: row.assignments.filter(matchesSection) }))
    .filter((row) => row.assignments.length > 0).map((row) => [row.plan.id, row])).values()]
  const rows = scoped.filter((row) => filters.status === 'All statuses' || statuses[row.plan.statusCode] === filters.status)
  const statusCounts: Record<LifecycleStatus, number> = { Draft: 0, 'Principal Review': 0, 'Awaiting Signatures': 0, Signed: 0, Archived: 0 }
  for (const row of rows) {
    const status = statuses[row.plan.statusCode]
    if (status) statusCounts[status]++
  }
  const active = rows.filter((row) => row.plan.statusCode !== 2).length
  const signed = statusCounts.Signed
  const groupBySchool = !filters.schoolId && filters.audience === 'executive'
  const groups = new Map<string, { label: string; active: Set<string>; signed: Set<string> }>()
  for (const row of rows) {
    for (const assignment of row.assignments) {
      const id = groupBySchool ? assignment.schoolId : assignment.teacherId
      const group = groups.get(id) ?? { label: groupBySchool ? assignment.schoolName : assignment.teacherName, active: new Set<string>(), signed: new Set<string>() }
      if (row.plan.statusCode !== 2) group.active.add(row.plan.id)
      if (row.plan.statusCode === 102370003) group.signed.add(row.plan.id)
      groups.set(id, group)
    }
  }
  const accountability: Array<[string, string, number]> = [...groups.values()].map((group): [string, string, number] => {
    const rate = percentage(group.signed.size, group.active.size)
    return [group.label, `${rate}% signed`, rate]
  }).sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0]))
  const actions: Array<[string, string, string, LifecycleStatus]> = []
  if (statusCounts['Principal Review']) actions.push([`${statusCounts['Principal Review']} plans are waiting for principal review`, 'Review', 'Review the exported plans and advance them for signatures.', 'Principal Review'])
  if (statusCounts['Awaiting Signatures']) actions.push([`${statusCounts['Awaiting Signatures']} signature packages have not been returned`, 'Follow up', 'Review outstanding signature requests.', 'Awaiting Signatures'])
  if (statusCounts.Draft) actions.push([`${statusCounts.Draft} draft plans need progression`, 'Monitor', 'Complete required modules and prepare plans for review.', 'Draft'])
  const visibleProgramPlanQueue = rows.map(({ plan, student, assignments }) => {
    const assignment = assignments[0]
    const name = filters.obfuscated ? student.obfuscatedName || 'Student' : student.name
    const asn = filters.obfuscated ? student.obfuscatedAsn || '' : student.asn
    const context: IppPreviewContext = { teacherSectionId: assignment.id, studentId: student.id, planId: plan.id,
      studentName: name, studentAsn: asn, grade: plan.gradeAtPlan || student.grade, schoolName: plan.schoolAtPlan || assignment.schoolName,
      schoolYear: plan.schoolYear, teacherName: assignment.teacherName, courseName: assignment.courseName }
    return { id: plan.id, student: name, grade: context.grade, school: context.schoolName,
      teacher: [...new Set(assignments.map((item) => item.teacherName))].join(', '),
      updated: plan.modifiedOn ? new Date(plan.modifiedOn).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not recorded',
      status: statuses[plan.statusCode] ?? plan.status, context }
  })
  return { visibleProgramPlanQueue, statusCounts, programPlansView: {
    title: groupBySchool ? 'Division plan progress and governed actions' : filters.audience === 'teacher' ? 'My Student Program Plans and next actions' : 'School plan progress and governed actions',
    description: 'Monitor Student Program Plans in the selected scope and act on plans waiting for review, signatures, or completion.',
    scope: groupBySchool ? 'Division view' : filters.audience === 'teacher' ? 'Teacher and support staff view' : 'School view',
    active, attention: statusCounts.Draft + statusCounts['Principal Review'] + statusCounts['Awaiting Signatures'], signed, rate: percentage(signed, active),
    accountabilityTitle: groupBySchool ? 'Plan progress by school' : 'Plan progress by teacher', accountability, actions,
  } }
}
