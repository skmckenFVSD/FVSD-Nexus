export type AssessmentWorkspaceSelection = {
  schoolId: string
  sectionGroup: string
  courseNumber: string
  teacherId: string
  studentId: string
  assessmentType: string
}

export const emptyAssessmentWorkspaceSelection: AssessmentWorkspaceSelection = {
  schoolId: '',
  sectionGroup: '',
  courseNumber: '',
  teacherId: '',
  studentId: '',
  assessmentType: 'TOSREC',
}
