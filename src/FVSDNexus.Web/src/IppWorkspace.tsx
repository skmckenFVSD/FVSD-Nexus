import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import {
  Accessibility,
  ArrowLeft,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Download,
  FileCheck2,
  FileText,
  Files,
  FilePlus2,
  FileX2,
  GripVertical,
  ImageIcon,
  LockKeyhole,
  PanelsTopLeft,
  Paperclip,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Signature,
  Star,
  StickyNoteCheck,
  StickyNoteOff,
  Target,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import type { IppPreviewContext } from './IppPreview'

type StudentPlanHistoryRecord = {
  id: string
  name: string
  schoolYear: string
}

type StudentPlanModule = {
  id: string
  name: string
  group: string
  description: string
  frontFacingDescription: string
  sortOrder: number
  selected: boolean
  available: boolean
  locksWhenSelected: boolean
  locked: boolean
  canRemove: boolean
  stateReason?: string | null
}

type StudentPlanDetails = {
  schoolYear: string
  gradeAtPlan?: string | null
  schoolAtPlan?: string | null
  courseName?: string | null
  teacherAtPlan?: string | null
  principalAtPlan?: string | null
  parentOrGuardianName?: string | null
  parentOrGuardianEmail?: string | null
  fallAttendance?: number | null
  winterAttendance?: number | null
  springAttendance?: number | null
  modifiedOn?: string | null
}

type StudentPlanModulesResponse = {
  planId: string
  eTag: string
  details: StudentPlanDetails
  modules: StudentPlanModule[]
}

type StudentPlanAttendanceCommand = {
  fallAttendance: number | null
  winterAttendance: number | null
  springAttendance: number | null
}

type StudentPlanSignatureRecord = {
  id: string
  name: string
  recipientType: number
  recipientTypeLabel: string
  signatoryRole: number
  signatoryRoleLabel: string
  signatoryName: string
  signatoryEmail: string
  signatoryOrder: number
  signatoryAddedOrder: number
  allowComments: boolean
  dateRequested?: string | null
  dateSigned?: string | null
  stateCode: number
  stateLabel: string
  statusCode: number
  statusLabel: string
  eTag?: string | null
}

type StudentPlanSignaturesResponse = {
  planId: string
  schoolYear: string
  signatures: StudentPlanSignatureRecord[]
}

type StudentPlanSignatureChoiceOption = {
  value: number
  label: string
}

type StudentPlanSignatureOptionsResponse = {
  recipientTypes: StudentPlanSignatureChoiceOption[]
  signatoryRoles: StudentPlanSignatureChoiceOption[]
}

type StudentPlanSignatureCommand = {
  recipientType: number
  signatoryRole: number
  signatoryName: string
  signatoryEmail: string
  signatoryOrder: number
  allowComments: boolean
}

type StudentPlanScreenerResult = {
  assessmentType: string
  period: string
  periodSortOrder: number
  assessmentDate?: string | null
  standardScore?: number | null
  descriptiveTerm?: string | null
  descriptiveTermFill?: string | null
  descriptiveTermFont?: string | null
}

type StudentPlanScreenersResponse = {
  planId: string
  schoolYear: string
  results: StudentPlanScreenerResult[]
}

type StudentPlanOralReadingFluencyResult = {
  id: string
  assessmentDate?: string | null
  levelOfReading: number
  levelOfReadingLabel: string
  wordsPerMinute: number
  eTag?: string | null
}

type StudentPlanOralReadingFluencyResponse = {
  planId: string
  schoolYear: string
  results: StudentPlanOralReadingFluencyResult[]
}

type StudentPlanOralReadingFluencyOption = {
  value: number
  label: string
}

type StudentPlanOralReadingFluencyOptionsResponse = {
  levelsOfReading: StudentPlanOralReadingFluencyOption[]
}

type StudentPlanOralReadingFluencyCommand = {
  assessmentDate: string
  levelOfReading: number
  wordsPerMinute: number
}

type StudentPlanWordStudyRecord = {
  id: string
  name: string
  termStartDate?: string | null
  termEndDate?: string | null
  startingLevelId: string
  startingLevelName: string
  startingStageReference?: string | null
  startingExpectedGrade?: string | null
  finishingLevelId?: string | null
  finishingLevelName?: string | null
  finishingStageReference?: string | null
  finishingExpectedGrade?: string | null
  eTag?: string | null
}

type StudentPlanWordStudyResponse = {
  planId: string
  schoolYear: string
  records: StudentPlanWordStudyRecord[]
}

type StudentPlanWordStudyStageOption = {
  id: string
  name: string
  section?: string | null
  expectedGrade?: string | null
  sortOrder: number
  display: string
}

type StudentPlanWordStudyOptionsResponse = {
  stages: StudentPlanWordStudyStageOption[]
}

type StudentPlanWordStudyCommand = {
  termStartDate: string
  startingLevelId: string
  termEndDate: string | null
  finishingLevelId: string | null
}

type StudentPlanEmpowerLevelOption = {
  id: string
  name: string
  description: string
  fillHex: string
  fontHex: string
  sortOrder: number
}

type StudentPlanEmpowerGoal = {
  goalId: string
  name: string
  alias: string
  description: string
  foundationLevel: string
  division: string
  subsection?: string | null
  sortOrder: number
  progressId?: string | null
  initialLevelId?: string | null
  initialLevelName?: string | null
  initialLevelFillHex?: string | null
  initialLevelFontHex?: string | null
  initialDate?: string | null
  currentLevelId?: string | null
  currentLevelName?: string | null
  currentLevelFillHex?: string | null
  currentLevelFontHex?: string | null
  currentDate?: string | null
  eTag?: string | null
}

type StudentPlanEmpowerResponse = {
  planId: string
  schoolYear: string
  sectionName: string
  sectionDescription: string
  levels: StudentPlanEmpowerLevelOption[]
  goals: StudentPlanEmpowerGoal[]
}

type StudentPlanEmpowerProgressCommand = {
  levelId: string
  dateAchieved: string
}

type StudentPlanMathematicsLevelOption = StudentPlanEmpowerLevelOption

type StudentPlanMathematicsGoal = {
  goalId: string
  name: string
  alias: string
  description: string
  outcome: string
  grade: string
  columnTitle: string
  sortOrder: number
  progressId?: string | null
  initialLevelId?: string | null
  initialLevelName?: string | null
  initialLevelFillHex?: string | null
  initialLevelFontHex?: string | null
  initialDate?: string | null
  currentLevelId?: string | null
  currentLevelName?: string | null
  currentLevelFillHex?: string | null
  currentLevelFontHex?: string | null
  currentDate?: string | null
  eTag?: string | null
}

type StudentPlanMathematicsResponse = {
  planId: string
  schoolYear: string
  sectionName: string
  sectionDescription: string
  levels: StudentPlanMathematicsLevelOption[]
  goals: StudentPlanMathematicsGoal[]
}

type StudentPlanMathematicsProgressCommand = StudentPlanEmpowerProgressCommand

type StudentPlanFmcsLevelOption = StudentPlanEmpowerLevelOption

type StudentPlanFmcsGoal = {
  goalId: string
  name: string
  alias: string
  description: string
  outcome: string
  columnTitle: string
  sortOrder: number
  progressId?: string | null
  initialLevelId?: string | null
  initialLevelName?: string | null
  initialLevelFillHex?: string | null
  initialLevelFontHex?: string | null
  initialDate?: string | null
  currentLevelId?: string | null
  currentLevelName?: string | null
  currentLevelFillHex?: string | null
  currentLevelFontHex?: string | null
  currentDate?: string | null
  eTag?: string | null
}

type StudentPlanFmcsResponse = {
  planId: string
  schoolYear: string
  sectionName: string
  sectionDescription: string
  levels: StudentPlanFmcsLevelOption[]
  goals: StudentPlanFmcsGoal[]
}

type StudentPlanFmcsProgressCommand = StudentPlanEmpowerProgressCommand

type StudentPlanWritingSnapshotRecord = {
  id: string
  subject: string
  description: string
  includeInExport: boolean
  commentDate?: string | null
  addedBy: string
  createdOn?: string | null
  hasWritingSampleFile: boolean
  writingSampleFileName?: string | null
  hasWritingSampleImage: boolean
  eTag?: string | null
}

type StudentPlanWritingSnapshotsResponse = {
  planId: string
  schoolYear: string
  snapshots: StudentPlanWritingSnapshotRecord[]
}

type StudentPlanWritingSnapshotCommand = {
  commentDate: string
  evidenceOfDevelopment: string
  includeInExport: boolean
  writingSampleFile: File | null
  writingSampleImage: File | null
}

type StudentPlanTeacherCommentRecord = {
  id: string
  sectionId: string
  sectionName: string
  commentsAndNextSteps: string
  additionalObservations?: string | null
  includeInExport: boolean
  commentDate?: string | null
  addedBy: string
  createdOn?: string | null
  eTag?: string | null
}

type StudentPlanTeacherCommentsResponse = {
  planId: string
  schoolYear: string
  comments: StudentPlanTeacherCommentRecord[]
}

type StudentPlanTeacherCommentCommand = {
  sectionId: string
  commentDate: string
  commentsAndNextSteps: string
  additionalObservations: string | null
  includeInExport: boolean
}

type StudentPlanIntervention = {
  id: string
  interventionTypeId?: string | null
  interventionType: string
  interventionist?: string | null
  teacher?: string | null
  school?: string | null
  grade?: string | null
  curriculum?: string | null
  courseNumber?: string | null
  courseName?: string | null
  dateStarted?: string | null
  dateWithdrawn?: string | null
  withdrawnReason?: string | null
  additionalInformation?: string | null
  eTag?: string | null
}

type StudentPlanInterventionsResponse = {
  planId: string
  schoolYear: string
  interventions: StudentPlanIntervention[]
}

type StudentPlanInterventionTypeOption = {
  id: string
  name: string
  alias: string
  curriculum?: string | null
}

type StudentPlanInterventionistOption = {
  name: string
  role: string
  display: string
}

type StudentPlanInterventionSectionOption = {
  teacherSectionId: string
  curriculum: string
  sectionGroup: string
  courseNumber: string
  courseName: string
  teacherName: string
}

type StudentPlanInterventionOptionsResponse = {
  planSectionGroup: string
  requiresSourceSection: boolean
  curricula: string[]
  studentSections: StudentPlanInterventionSectionOption[]
  interventionTypes: StudentPlanInterventionTypeOption[]
  interventionists: StudentPlanInterventionistOption[]
}

type StudentPlanInterventionCommand = {
  interventionTypeId: string
  dateStarted: string
  interventionist: string | null
  dateWithdrawn: string | null
  withdrawnReason: number | null
  additionalInformation: string | null
  sourceTeacherSectionId: string | null
}

type StudentPlanCodingCategoryOption = {
  id: string
  code: string
  name: string
}

type StudentPlanCodingConditionOption = {
  id: string
  categoryId?: string | null
  categoryName: string
  name: string
  details?: string | null
}

type StudentPlanCodingGroup = {
  key: string
  title: string
  categoryId?: string | null
  categoryName?: string | null
  conditions: string[]
  observations?: string | null
}

type StudentPlanCodingResponse = {
  planId: string
  eTag: string
  primary: StudentPlanCodingGroup
  additionalGroups: StudentPlanCodingGroup[]
  categories: StudentPlanCodingCategoryOption[]
  conditionOptions: StudentPlanCodingConditionOption[]
}

type StudentPlanCodingGroupCommand = {
  categoryId: string | null
  conditions: string[]
  observations: string | null
}

type StudentPlanCodingCommand = {
  primaryConditions: string[]
  additionalOne: StudentPlanCodingGroupCommand
  additionalTwo: StudentPlanCodingGroupCommand
  additionalThree: StudentPlanCodingGroupCommand
}

type StudentPlanDocument = {
  id: string
  title: string
  description?: string | null
  fileName: string
  mimeType: string
  fileSize?: number | null
  modifiedOn?: string | null
}

type ProblemDetails = {
  title?: string
  detail?: string
}

async function readError(response: Response) {
  try {
    const problem = await response.json() as ProblemDetails
    return problem.title ?? problem.detail ?? `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

function normalizePlanDescription(value: string) {
  return value.replaceAll('Individual Program Plan', 'Individual Education Plan')
}

const sectionNoteModuleNames = new Set([
  'Screener Results',
  'Intervention Focus',
  'Empower Reading',
  'SHES Foundations',
  'Mathematics',
])

function formatAttendance(value?: number | null) {
  if (value === null || value === undefined) return '—'
  return `${new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 }).format(value)}%`
}

function formatPlanDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function toPlanDateInput(value?: string | null) {
  if (!value) return ''
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? ''
}

function plainTextFromHtml(value?: string | null) {
  if (!value) return ''
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  return (parsed.body.textContent ?? '').replaceAll('\u00a0', ' ').trim()
}

export function IppWorkspace({ context, onBackToClassAssignment }: {
  context: IppPreviewContext
  onBackToClassAssignment: () => void
}) {
  const [planId, setPlanId] = useState(context.planId)
  const [moduleState, setModuleState] = useState<StudentPlanModulesResponse | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [loading, setLoading] = useState(Boolean(context.planId))
  const [creating, setCreating] = useState(false)
  const [changingModuleId, setChangingModuleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [screeners, setScreeners] = useState<StudentPlanScreenersResponse | null>(null)
  const [screenersLoading, setScreenersLoading] = useState(false)
  const [screenersError, setScreenersError] = useState<string | null>(null)
  const [oralReadingFluency, setOralReadingFluency] = useState<StudentPlanOralReadingFluencyResponse | null>(null)
  const [oralReadingFluencyLoading, setOralReadingFluencyLoading] = useState(false)
  const [oralReadingFluencyError, setOralReadingFluencyError] = useState<string | null>(null)
  const [oralReadingFluencyOptions, setOralReadingFluencyOptions] = useState<StudentPlanOralReadingFluencyOptionsResponse | null>(null)
  const [oralReadingFluencyOptionsLoading, setOralReadingFluencyOptionsLoading] = useState(false)
  const [oralReadingFluencyOptionsError, setOralReadingFluencyOptionsError] = useState<string | null>(null)
  const [oralReadingFluencyDialogOpen, setOralReadingFluencyDialogOpen] = useState(false)
  const [editingOralReadingFluency, setEditingOralReadingFluency] = useState<StudentPlanOralReadingFluencyResult | null>(null)
  const [wordStudy, setWordStudy] = useState<StudentPlanWordStudyResponse | null>(null)
  const [wordStudyLoading, setWordStudyLoading] = useState(false)
  const [wordStudyError, setWordStudyError] = useState<string | null>(null)
  const [wordStudyOptions, setWordStudyOptions] = useState<StudentPlanWordStudyOptionsResponse | null>(null)
  const [wordStudyOptionsLoading, setWordStudyOptionsLoading] = useState(false)
  const [wordStudyOptionsError, setWordStudyOptionsError] = useState<string | null>(null)
  const [wordStudyDialogOpen, setWordStudyDialogOpen] = useState(false)
  const [editingWordStudy, setEditingWordStudy] = useState<StudentPlanWordStudyRecord | null>(null)
  const [empowerReading, setEmpowerReading] = useState<StudentPlanEmpowerResponse | null>(null)
  const [empowerReadingLoading, setEmpowerReadingLoading] = useState(false)
  const [empowerReadingError, setEmpowerReadingError] = useState<string | null>(null)
  const [savingEmpowerGoalId, setSavingEmpowerGoalId] = useState<string | null>(null)
  const [mathematics, setMathematics] = useState<StudentPlanMathematicsResponse | null>(null)
  const [mathematicsLoading, setMathematicsLoading] = useState(false)
  const [mathematicsError, setMathematicsError] = useState<string | null>(null)
  const [savingMathematicsGoalId, setSavingMathematicsGoalId] = useState<string | null>(null)
  const [fmcsFoundations, setFmcsFoundations] = useState<StudentPlanFmcsResponse | null>(null)
  const [fmcsFoundationsLoading, setFmcsFoundationsLoading] = useState(false)
  const [fmcsFoundationsError, setFmcsFoundationsError] = useState<string | null>(null)
  const [savingFmcsGoalId, setSavingFmcsGoalId] = useState<string | null>(null)
  const [initializingFmcsOutcome, setInitializingFmcsOutcome] = useState(false)
  const [writingSnapshots, setWritingSnapshots] = useState<StudentPlanWritingSnapshotsResponse | null>(null)
  const [writingSnapshotsLoading, setWritingSnapshotsLoading] = useState(false)
  const [writingSnapshotsError, setWritingSnapshotsError] = useState<string | null>(null)
  const [writingSnapshotDialogOpen, setWritingSnapshotDialogOpen] = useState(false)
  const [editingWritingSnapshot, setEditingWritingSnapshot] = useState<StudentPlanWritingSnapshotRecord | null>(null)
  const [teacherComments, setTeacherComments] = useState<StudentPlanTeacherCommentsResponse | null>(null)
  const [teacherCommentsLoading, setTeacherCommentsLoading] = useState(false)
  const [teacherCommentsError, setTeacherCommentsError] = useState<string | null>(null)
  const [teacherCommentDialogOpen, setTeacherCommentDialogOpen] = useState(false)
  const [editingTeacherComment, setEditingTeacherComment] = useState<StudentPlanTeacherCommentRecord | null>(null)
  const [interventions, setInterventions] = useState<StudentPlanInterventionsResponse | null>(null)
  const [interventionsLoading, setInterventionsLoading] = useState(false)
  const [interventionsError, setInterventionsError] = useState<string | null>(null)
  const [interventionOptions, setInterventionOptions] = useState<StudentPlanInterventionOptionsResponse | null>(null)
  const [interventionOptionsLoading, setInterventionOptionsLoading] = useState(false)
  const [interventionOptionsError, setInterventionOptionsError] = useState<string | null>(null)
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<StudentPlanIntervention | null>(null)
  const [coding, setCoding] = useState<StudentPlanCodingResponse | null>(null)
  const [codingLoading, setCodingLoading] = useState(false)
  const [codingError, setCodingError] = useState<string | null>(null)
  const [codingDialogOpen, setCodingDialogOpen] = useState(false)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [signatures, setSignatures] = useState<StudentPlanSignaturesResponse | null>(null)
  const [signaturesLoading, setSignaturesLoading] = useState(false)
  const [signaturesError, setSignaturesError] = useState<string | null>(null)
  const [signatureOptions, setSignatureOptions] = useState<StudentPlanSignatureOptionsResponse | null>(null)
  const [signatureOptionsLoading, setSignatureOptionsLoading] = useState(false)
  const [signatureOptionsError, setSignatureOptionsError] = useState<string | null>(null)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [editingSignature, setEditingSignature] = useState<StudentPlanSignatureRecord | null>(null)
  const [excludedExportModuleIds, setExcludedExportModuleIds] = useState<Set<string>>(() => new Set())
  const [notesAfterSectionModuleIds, setNotesAfterSectionModuleIds] = useState<Set<string>>(() => new Set())
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const [documents, setDocuments] = useState<StudentPlanDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

  const loadModules = async (id: string, signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${id}/modules`,
        { credentials: 'include', signal },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanModulesResponse
      setModuleState(next)
      setActiveModuleId((current) => next.modules.some((module) => module.selected && module.id === current)
        ? current
        : next.modules.find((module) => module.selected)?.id ?? null)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'The plan modules could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPlanId(context.planId)
    setModuleState(null)
    setActiveModuleId(null)
    setManageOpen(false)
    setError(null)
    setNotice(null)
    setScreeners(null)
    setScreenersError(null)
    setOralReadingFluency(null)
    setOralReadingFluencyError(null)
    setOralReadingFluencyOptions(null)
    setOralReadingFluencyOptionsError(null)
    setOralReadingFluencyDialogOpen(false)
    setEditingOralReadingFluency(null)
    setWordStudy(null)
    setWordStudyError(null)
    setWordStudyOptions(null)
    setWordStudyOptionsError(null)
    setWordStudyDialogOpen(false)
    setEditingWordStudy(null)
    setEmpowerReading(null)
    setEmpowerReadingError(null)
    setSavingEmpowerGoalId(null)
    setMathematics(null)
    setMathematicsError(null)
    setSavingMathematicsGoalId(null)
    setFmcsFoundations(null)
    setFmcsFoundationsError(null)
    setSavingFmcsGoalId(null)
    setInitializingFmcsOutcome(false)
    setWritingSnapshots(null)
    setWritingSnapshotsError(null)
    setWritingSnapshotDialogOpen(false)
    setEditingWritingSnapshot(null)
    setTeacherComments(null)
    setTeacherCommentsError(null)
    setTeacherCommentDialogOpen(false)
    setEditingTeacherComment(null)
    setInterventions(null)
    setInterventionsError(null)
    setInterventionOptions(null)
    setInterventionOptionsError(null)
    setInterventionDialogOpen(false)
    setEditingIntervention(null)
    setCoding(null)
    setCodingError(null)
    setCodingDialogOpen(false)
    setAttendanceDialogOpen(false)
    setSignatures(null)
    setSignaturesError(null)
    setSignatureOptions(null)
    setSignatureOptionsError(null)
    setSignatureDialogOpen(false)
    setEditingSignature(null)
    setExcludedExportModuleIds(new Set())
    setNotesAfterSectionModuleIds(new Set())
    setDocumentsOpen(false)
    setDocuments([])
    setDocumentsError(null)
    setSelectedDocumentId(null)
  }, [context.planId, context.studentId, context.teacherSectionId])

  useEffect(() => {
    if (!planId) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void loadModules(planId, controller.signal)
    return () => controller.abort()
  }, [planId, context.studentId, context.teacherSectionId])

  const selectedModules = useMemo(
    () => moduleState?.modules.filter((module) => module.selected) ?? [],
    [moduleState],
  )
  const activeModule = selectedModules.find((module) => module.id === activeModuleId) ?? selectedModules[0]
  const activeModuleDescription = activeModule
    ? normalizePlanDescription(activeModule.frontFacingDescription || activeModule.description)
    : ''
  const teacherCommentSectionOptions = selectedModules.filter((module) => !new Set([
    'Student Details',
    'Student Conditions and Coding',
    'Writing Snapshot',
    'Teacher Comment and Next Steps',
    'Signatures',
  ]).has(module.name))

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Screener Results' || screeners?.planId === planId) return
    const controller = new AbortController()
    setScreenersLoading(true)
    setScreenersError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/screeners`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setScreeners(await response.json() as StudentPlanScreenersResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setScreenersError(requestError instanceof Error ? requestError.message : 'Screener results could not be loaded.')
    }).finally(() => setScreenersLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, screeners?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Oral Reading Fluency (ORF)' || oralReadingFluency?.planId === planId) return
    const controller = new AbortController()
    setOralReadingFluencyLoading(true)
    setOralReadingFluencyError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/oral-reading-fluency`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setOralReadingFluency(await response.json() as StudentPlanOralReadingFluencyResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setOralReadingFluencyError(requestError instanceof Error
        ? requestError.message
        : 'Oral reading fluency results could not be loaded.')
    }).finally(() => setOralReadingFluencyLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, oralReadingFluency?.planId, planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Word Study' || wordStudy?.planId === planId) return
    const controller = new AbortController()
    setWordStudyLoading(true)
    setWordStudyError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/word-study`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setWordStudy(await response.json() as StudentPlanWordStudyResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setWordStudyError(requestError instanceof Error ? requestError.message : 'Word Study records could not be loaded.')
    }).finally(() => setWordStudyLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, wordStudy?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Empower Reading' || empowerReading?.planId === planId) return
    const controller = new AbortController()
    setEmpowerReadingLoading(true)
    setEmpowerReadingError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/empower-reading`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setEmpowerReading(await response.json() as StudentPlanEmpowerResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setEmpowerReadingError(requestError instanceof Error
        ? requestError.message
        : 'Empower Reading goals could not be loaded.')
    }).finally(() => setEmpowerReadingLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, empowerReading?.planId, planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Mathematics' || mathematics?.planId === planId) return
    const controller = new AbortController()
    setMathematicsLoading(true)
    setMathematicsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/mathematics`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setMathematics(await response.json() as StudentPlanMathematicsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setMathematicsError(requestError instanceof Error
        ? requestError.message
        : 'Mathematics goals could not be loaded.')
    }).finally(() => setMathematicsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, mathematics?.planId, planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'FMCS Foundations' || fmcsFoundations?.planId === planId) return
    const controller = new AbortController()
    setFmcsFoundationsLoading(true)
    setFmcsFoundationsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/fmcs-foundations`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setFmcsFoundations(await response.json() as StudentPlanFmcsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setFmcsFoundationsError(requestError instanceof Error
        ? requestError.message
        : 'FMCS Foundations goals could not be loaded.')
    }).finally(() => setFmcsFoundationsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, fmcsFoundations?.planId, planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Writing Snapshot' || writingSnapshots?.planId === planId) return
    const controller = new AbortController()
    setWritingSnapshotsLoading(true)
    setWritingSnapshotsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/writing-snapshots`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setWritingSnapshots(await response.json() as StudentPlanWritingSnapshotsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setWritingSnapshotsError(requestError instanceof Error
        ? requestError.message
        : 'Writing Snapshot records could not be loaded.')
    }).finally(() => setWritingSnapshotsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, writingSnapshots?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Teacher Comment and Next Steps' || teacherComments?.planId === planId) return
    const controller = new AbortController()
    setTeacherCommentsLoading(true)
    setTeacherCommentsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/teacher-comments`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setTeacherComments(await response.json() as StudentPlanTeacherCommentsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setTeacherCommentsError(requestError instanceof Error
        ? requestError.message
        : 'Teacher Comments could not be loaded.')
    }).finally(() => setTeacherCommentsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, teacherComments?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Intervention Focus' || interventions?.planId === planId) return
    const controller = new AbortController()
    setInterventionsLoading(true)
    setInterventionsError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/interventions`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setInterventions(await response.json() as StudentPlanInterventionsResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setInterventionsError(requestError instanceof Error ? requestError.message : 'Interventions could not be loaded.')
    }).finally(() => setInterventionsLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, interventions?.planId, planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Signatures' || signatures?.planId === planId) return
    const controller = new AbortController()
    setSignaturesLoading(true)
    setSignaturesError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signatures`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setSignatures(await response.json() as StudentPlanSignaturesResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setSignaturesError(requestError instanceof Error ? requestError.message : 'Signatures could not be loaded.')
    }).finally(() => setSignaturesLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, context.studentId, context.teacherSectionId, planId, signatures?.planId])

  useEffect(() => {
    if (!planId || activeModule?.name !== 'Student Conditions and Coding' || coding?.planId === planId) return
    const controller = new AbortController()
    setCodingLoading(true)
    setCodingError(null)
    void fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/coding`,
      { credentials: 'include', signal: controller.signal },
    ).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      setCoding(await response.json() as StudentPlanCodingResponse)
    }).catch((requestError) => {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setCodingError(requestError instanceof Error
        ? requestError.message
        : 'Student coding and conditions could not be loaded.')
    }).finally(() => setCodingLoading(false))
    return () => controller.abort()
  }, [activeModule?.name, coding?.planId, context.studentId, context.teacherSectionId, planId])
  const moduleGroups = useMemo(() => {
    const groups = new Map<string, StudentPlanModule[]>()
    for (const module of moduleState?.modules ?? []) {
      const entries = groups.get(module.group) ?? []
      entries.push(module)
      groups.set(module.group, entries)
    }
    return [...groups.entries()]
  }, [moduleState])

  const createPlan = async () => {
    setCreating(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans`,
        { method: 'POST', credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const plan = await response.json() as StudentPlanHistoryRecord
      setPlanId(plan.id)
      setNotice(`The ${plan.schoolYear} annual plan was created with its required modules.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The annual plan could not be created.')
    } finally {
      setCreating(false)
    }
  }

  const changeModule = async (module: StudentPlanModule, add: boolean) => {
    if (!planId || !moduleState) return
    if (add && module.locksWhenSelected && !window.confirm(
      `${module.name} is configured to lock after it is added. Add it to this annual plan?`,
    )) return
    if (!add && !window.confirm(
      `Remove ${module.name} from this plan? Its source records will not be deleted.`,
    )) return

    setChangingModuleId(module.id)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/modules/${module.id}`,
        {
          method: add ? 'PUT' : 'DELETE',
          credentials: 'include',
          headers: { 'If-Match': moduleState.eTag },
        },
      )
      if (!response.ok) {
        const message = await readError(response)
        if (response.status === 409) {
          await loadModules(planId)
          throw new Error(`${message} The current module selection has been reloaded.`)
        }
        throw new Error(message)
      }
      const next = await response.json() as StudentPlanModulesResponse
      setModuleState(next)
      setExcludedExportModuleIds((current) => {
        if (!current.has(module.id)) return current
        const nextExcluded = new Set(current)
        nextExcluded.delete(module.id)
        return nextExcluded
      })
      setNotesAfterSectionModuleIds((current) => {
        if (!current.has(module.id)) return current
        const nextNotes = new Set(current)
        nextNotes.delete(module.id)
        return nextNotes
      })
      if (add) {
        setActiveModuleId(module.id)
        setNotice(`${module.name} was added to the plan.`)
      } else {
        setActiveModuleId((current) => current === module.id
          ? next.modules.find((item) => item.selected)?.id ?? null
          : current)
        setNotice(`${module.name} was removed from the plan.`)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The module selection could not be saved.')
    } finally {
      setChangingModuleId(null)
    }
  }

  const toggleModuleExport = (moduleId: string) => {
    setExcludedExportModuleIds((current) => {
      const next = new Set(current)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const toggleModuleNotesPlacement = (moduleId: string) => {
    setNotesAfterSectionModuleIds((current) => {
      const next = new Set(current)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const loadDocuments = async () => {
    if (!planId) return
    setDocumentsLoading(true)
    setDocumentsError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/documents`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      setDocuments(await response.json() as StudentPlanDocument[])
    } catch (requestError) {
      setDocumentsError(requestError instanceof Error
        ? requestError.message
        : 'Compiled documents could not be loaded.')
    } finally {
      setDocumentsLoading(false)
    }
  }

  const openDocuments = () => {
    setManageOpen(false)
    setDocumentsOpen(true)
    setSelectedDocumentId(null)
    void loadDocuments()
  }

  const closeDocuments = () => {
    setDocumentsOpen(false)
    setSelectedDocumentId(null)
  }

  const documentContentUrl = (documentId: string, download: boolean) =>
    `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/documents/${documentId}/content?download=${download}`

  const saveAttendance = async (command: StudentPlanAttendanceCommand) => {
    if (!planId || !moduleState) throw new Error('Reload the plan before updating attendance.')

    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/attendance`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'If-Match': moduleState.eTag,
        },
        body: JSON.stringify(command),
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) {
        await loadModules(planId)
        throw new Error(`${message} The current attendance values have been reloaded.`)
      }
      throw new Error(message)
    }

    const next = await response.json() as StudentPlanModulesResponse
    setModuleState(next)
    setNotice('Student attendance was updated.')
    setError(null)
  }

  const loadSignatureOptions = async () => {
    if (!planId) throw new Error('Open the annual plan before changing signatures.')
    setSignatureOptionsLoading(true)
    setSignatureOptionsError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signatures/options`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanSignatureOptionsResponse
      setSignatureOptions(next)
      return next
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Signature choices could not be loaded.'
      setSignatureOptionsError(message)
      throw new Error(message)
    } finally {
      setSignatureOptionsLoading(false)
    }
  }

  const openSignatureDialog = (signature: StudentPlanSignatureRecord | null) => {
    setEditingSignature(signature)
    setSignatureDialogOpen(true)
    if (!signatureOptions) void loadSignatureOptions().catch(() => undefined)
  }

  const saveSignature = async (
    command: StudentPlanSignatureCommand,
    signature: StudentPlanSignatureRecord | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this signature.')
    const url = `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signatures${signature ? `/${signature.id}` : ''}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (signature) {
      if (!signature.eTag) throw new Error('Reload the signature before saving your changes.')
      headers['If-Match'] = signature.eTag
    }

    const response = await fetch(url, {
      method: signature ? 'PATCH' : 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(command),
    })
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setSignatures(null)
      throw new Error(message)
    }

    setSignatures(await response.json() as StudentPlanSignaturesResponse)
    setSignaturesError(null)
    setNotice(signature ? 'The signature assignment was updated.' : 'The signature was added to the annual plan.')
    setError(null)
  }

  const deleteSignature = async (signature: StudentPlanSignatureRecord) => {
    if (!planId || !signature.eTag) throw new Error('Reload the signature before deleting it.')
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signatures/${signature.id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'If-Match': signature.eTag },
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setSignatures(null)
      throw new Error(message)
    }

    setSignatures(await response.json() as StudentPlanSignaturesResponse)
    setSignaturesError(null)
    setNotice('The signature was removed from the annual plan.')
    setError(null)
  }

  const reorderSignatures = async (ordered: StudentPlanSignatureRecord[]) => {
    if (!planId) throw new Error('Reload the annual plan before changing the signature order.')
    if (ordered.some((signature) => !signature.eTag)) {
      throw new Error('Reload the signatures before changing their order.')
    }

    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signatures/order`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatures: ordered.map((signature) => ({ id: signature.id, eTag: signature.eTag })),
        }),
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setSignatures(null)
      throw new Error(message)
    }

    const next = await response.json() as StudentPlanSignaturesResponse
    setSignatures(next)
    setSignaturesError(null)
    setNotice('The signature routing order was updated.')
    setError(null)
    return next
  }

  const loadOralReadingFluencyOptions = async () => {
    if (!planId) throw new Error('Open the annual plan before changing oral reading fluency results.')
    setOralReadingFluencyOptionsLoading(true)
    setOralReadingFluencyOptionsError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/oral-reading-fluency/options`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanOralReadingFluencyOptionsResponse
      setOralReadingFluencyOptions(next)
      return next
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Level of Reading choices could not be loaded.'
      setOralReadingFluencyOptionsError(message)
      throw new Error(message)
    } finally {
      setOralReadingFluencyOptionsLoading(false)
    }
  }

  const openOralReadingFluencyDialog = (result: StudentPlanOralReadingFluencyResult | null) => {
    setEditingOralReadingFluency(result)
    setOralReadingFluencyDialogOpen(true)
    if (!oralReadingFluencyOptions) void loadOralReadingFluencyOptions().catch(() => undefined)
  }

  const saveOralReadingFluency = async (
    command: StudentPlanOralReadingFluencyCommand,
    result: StudentPlanOralReadingFluencyResult | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this result.')
    const url = `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/oral-reading-fluency${result ? `/${result.id}` : ''}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (result) {
      if (!result.eTag) throw new Error('Reload the result before saving your changes.')
      headers['If-Match'] = result.eTag
    }
    const response = await fetch(url, {
      method: result ? 'PATCH' : 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(command),
    })
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setOralReadingFluency(null)
      throw new Error(message)
    }
    setOralReadingFluency(await response.json() as StudentPlanOralReadingFluencyResponse)
    setOralReadingFluencyError(null)
    setNotice(result ? 'The oral reading fluency result was updated.' : 'The oral reading fluency result was added.')
    setError(null)
  }

  const deleteOralReadingFluency = async (result: StudentPlanOralReadingFluencyResult) => {
    if (!planId || !result.eTag) throw new Error('Reload the result before deleting it.')
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/oral-reading-fluency/${result.id}`,
      { method: 'DELETE', credentials: 'include', headers: { 'If-Match': result.eTag } },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setOralReadingFluency(null)
      throw new Error(message)
    }
    setOralReadingFluency(await response.json() as StudentPlanOralReadingFluencyResponse)
    setOralReadingFluencyError(null)
    setNotice('The oral reading fluency result was deleted.')
    setError(null)
  }

  const loadWordStudyOptions = async () => {
    if (!planId) throw new Error('Open the annual plan before changing Word Study records.')
    setWordStudyOptionsLoading(true)
    setWordStudyOptionsError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/word-study/options`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanWordStudyOptionsResponse
      setWordStudyOptions(next)
      return next
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Words Their Way stages could not be loaded.'
      setWordStudyOptionsError(message)
      throw new Error(message)
    } finally {
      setWordStudyOptionsLoading(false)
    }
  }

  const openWordStudyDialog = (record: StudentPlanWordStudyRecord | null) => {
    setEditingWordStudy(record)
    setWordStudyDialogOpen(true)
    if (!wordStudyOptions) void loadWordStudyOptions().catch(() => undefined)
  }

  const saveWordStudy = async (
    command: StudentPlanWordStudyCommand,
    record: StudentPlanWordStudyRecord | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this Word Study record.')
    const url = `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/word-study${record ? `/${record.id}` : ''}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (record) {
      if (!record.eTag) throw new Error('Reload the Word Study record before saving your changes.')
      headers['If-Match'] = record.eTag
    }
    const response = await fetch(url, {
      method: record ? 'PATCH' : 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(command),
    })
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setWordStudy(null)
      throw new Error(message)
    }
    setWordStudy(await response.json() as StudentPlanWordStudyResponse)
    setWordStudyError(null)
    setNotice(record ? 'The Word Study record was updated.' : 'The Word Study record was added.')
    setError(null)
  }

  const deleteWordStudy = async (record: StudentPlanWordStudyRecord) => {
    if (!planId || !record.eTag) throw new Error('Reload the Word Study record before deleting it.')
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/word-study/${record.id}`,
      { method: 'DELETE', credentials: 'include', headers: { 'If-Match': record.eTag } },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setWordStudy(null)
      throw new Error(message)
    }
    setWordStudy(await response.json() as StudentPlanWordStudyResponse)
    setWordStudyError(null)
    setNotice('The Word Study record was deleted.')
    setError(null)
  }

  const saveEmpowerProgress = async (
    goal: StudentPlanEmpowerGoal,
    command: StudentPlanEmpowerProgressCommand,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this Empower goal.')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (goal.progressId) {
      if (!goal.eTag) throw new Error('Reload the Empower goal before saving your changes.')
      headers['If-Match'] = goal.eTag
    }
    setSavingEmpowerGoalId(goal.goalId)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/empower-reading/goals/${goal.goalId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify(command),
        },
      )
      if (!response.ok) {
        const message = await readError(response)
        if (response.status === 409) setEmpowerReading(null)
        throw new Error(message)
      }
      setEmpowerReading(await response.json() as StudentPlanEmpowerResponse)
      setEmpowerReadingError(null)
      setNotice(`${goal.name} was updated.`)
      setError(null)
    } finally {
      setSavingEmpowerGoalId(null)
    }
  }

  const saveMathematicsProgress = async (
    goal: StudentPlanMathematicsGoal,
    command: StudentPlanMathematicsProgressCommand,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this Mathematics goal.')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (goal.progressId) {
      if (!goal.eTag) throw new Error('Reload the Mathematics goal before saving your changes.')
      headers['If-Match'] = goal.eTag
    }
    setSavingMathematicsGoalId(goal.goalId)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/mathematics/goals/${goal.goalId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify(command),
        },
      )
      if (!response.ok) {
        const message = await readError(response)
        if (response.status === 409) setMathematics(null)
        throw new Error(message)
      }
      setMathematics(await response.json() as StudentPlanMathematicsResponse)
      setMathematicsError(null)
      setNotice(`${goal.name} was updated.`)
      setError(null)
    } finally {
      setSavingMathematicsGoalId(null)
    }
  }

  const saveFmcsProgress = async (
    goal: StudentPlanFmcsGoal,
    command: StudentPlanFmcsProgressCommand,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this FMCS Foundations goal.')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (goal.progressId) {
      if (!goal.eTag) throw new Error('Reload the FMCS Foundations goal before saving your changes.')
      headers['If-Match'] = goal.eTag
    }
    setSavingFmcsGoalId(goal.goalId)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/fmcs-foundations/goals/${goal.goalId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify(command),
        },
      )
      if (!response.ok) {
        const message = await readError(response)
        if (response.status === 409) setFmcsFoundations(null)
        throw new Error(message)
      }
      setFmcsFoundations(await response.json() as StudentPlanFmcsResponse)
      setFmcsFoundationsError(null)
      setNotice(`${goal.name} was updated.`)
      setError(null)
    } finally {
      setSavingFmcsGoalId(null)
    }
  }

  const initializeFmcsOutcomeRecords = async (outcome: string) => {
    if (!planId) throw new Error('Reload the annual plan before selecting an FMCS Foundations Outcome.')
    setInitializingFmcsOutcome(true)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/fmcs-foundations/outcomes`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome }),
        },
      )
      if (!response.ok) throw new Error(await readError(response))
      setFmcsFoundations(await response.json() as StudentPlanFmcsResponse)
      setFmcsFoundationsError(null)
      setNotice(`${outcome} is ready for progress entry.`)
      setError(null)
    } finally {
      setInitializingFmcsOutcome(false)
    }
  }

  const openWritingSnapshotDialog = (snapshot: StudentPlanWritingSnapshotRecord | null) => {
    setEditingWritingSnapshot(snapshot)
    setWritingSnapshotDialogOpen(true)
  }

  const saveWritingSnapshot = async (
    command: StudentPlanWritingSnapshotCommand,
    snapshot: StudentPlanWritingSnapshotRecord | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this Writing Snapshot.')
    const form = new FormData()
    form.append('commentDate', command.commentDate)
    form.append('evidenceOfDevelopment', command.evidenceOfDevelopment)
    form.append('includeInExport', String(command.includeInExport))
    if (command.writingSampleFile) form.append('writingSampleFile', command.writingSampleFile)
    if (command.writingSampleImage) form.append('writingSampleImage', command.writingSampleImage)
    const headers: Record<string, string> = {}
    if (snapshot) {
      if (!snapshot.eTag) throw new Error('Reload the Writing Snapshot before saving your changes.')
      headers['If-Match'] = snapshot.eTag
    }
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/writing-snapshots${snapshot ? `/${snapshot.id}` : ''}`,
      {
        method: snapshot ? 'PATCH' : 'POST',
        credentials: 'include',
        headers,
        body: form,
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setWritingSnapshots(null)
      throw new Error(message)
    }
    setWritingSnapshots(await response.json() as StudentPlanWritingSnapshotsResponse)
    setWritingSnapshotsError(null)
    setNotice(snapshot ? 'The Writing Snapshot was updated.' : 'The Writing Snapshot was added.')
    setError(null)
  }

  const deleteWritingSnapshot = async (snapshot: StudentPlanWritingSnapshotRecord) => {
    if (!planId || !snapshot.eTag) throw new Error('Reload the Writing Snapshot before deleting it.')
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/writing-snapshots/${snapshot.id}`,
      { method: 'DELETE', credentials: 'include', headers: { 'If-Match': snapshot.eTag } },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setWritingSnapshots(null)
      throw new Error(message)
    }
    setWritingSnapshots(await response.json() as StudentPlanWritingSnapshotsResponse)
    setWritingSnapshotsError(null)
    setNotice('The Writing Snapshot was deleted.')
    setError(null)
  }

  const writingSnapshotContentUrl = (snapshotId: string, kind: 'file' | 'image') =>
    `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/writing-snapshots/${snapshotId}/${kind}`

  const openTeacherCommentDialog = (comment: StudentPlanTeacherCommentRecord | null) => {
    setEditingTeacherComment(comment)
    setTeacherCommentDialogOpen(true)
  }

  const saveTeacherComment = async (
    command: StudentPlanTeacherCommentCommand,
    comment: StudentPlanTeacherCommentRecord | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this Teacher Comment.')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (comment) {
      if (!comment.eTag) throw new Error('Reload the Teacher Comment before saving your changes.')
      headers['If-Match'] = comment.eTag
    }
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/teacher-comments${comment ? `/${comment.id}` : ''}`,
      {
        method: comment ? 'PATCH' : 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(command),
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setTeacherComments(null)
      throw new Error(message)
    }
    setTeacherComments(await response.json() as StudentPlanTeacherCommentsResponse)
    setTeacherCommentsError(null)
    setNotice(comment ? 'The Teacher Comment was updated.' : 'The Teacher Comment was added.')
    setError(null)
  }

  const deleteTeacherComment = async (comment: StudentPlanTeacherCommentRecord) => {
    if (!planId || !comment.eTag) throw new Error('Reload the Teacher Comment before deleting it.')
    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/teacher-comments/${comment.id}`,
      { method: 'DELETE', credentials: 'include', headers: { 'If-Match': comment.eTag } },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setTeacherComments(null)
      throw new Error(message)
    }
    setTeacherComments(await response.json() as StudentPlanTeacherCommentsResponse)
    setTeacherCommentsError(null)
    setNotice('The Teacher Comment was deleted.')
    setError(null)
  }

  const saveCoding = async (command: StudentPlanCodingCommand) => {
    if (!planId || !coding) throw new Error('Reload the coding and conditions section before saving changes.')

    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/coding`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'If-Match': coding.eTag,
        },
        body: JSON.stringify(command),
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) {
        setCoding(null)
        throw new Error(`${message} Reopen this section to load the current student details.`)
      }
      throw new Error(message)
    }

    setCoding(await response.json() as StudentPlanCodingResponse)
    setNotice('Student coding and conditions were updated.')
    setError(null)
  }

  const loadInterventionOptions = async () => {
    if (!planId) throw new Error('Open the annual plan before changing interventions.')
    setInterventionOptionsLoading(true)
    setInterventionOptionsError(null)
    try {
      const response = await fetch(
        `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/interventions/options`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error(await readError(response))
      const next = await response.json() as StudentPlanInterventionOptionsResponse
      setInterventionOptions(next)
      return next
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Intervention choices could not be loaded.'
      setInterventionOptionsError(message)
      throw new Error(message)
    } finally {
      setInterventionOptionsLoading(false)
    }
  }

  const openInterventionDialog = (intervention: StudentPlanIntervention | null) => {
    setEditingIntervention(intervention)
    setInterventionDialogOpen(true)
    if (!interventionOptions) void loadInterventionOptions().catch(() => undefined)
  }

  const saveIntervention = async (
    command: StudentPlanInterventionCommand,
    intervention: StudentPlanIntervention | null,
  ) => {
    if (!planId) throw new Error('Reload the annual plan before saving this intervention.')
    const url = `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/interventions${intervention ? `/${intervention.id}` : ''}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (intervention) {
      if (!intervention.eTag) throw new Error('Reload the intervention before saving your changes.')
      headers['If-Match'] = intervention.eTag
    }

    const response = await fetch(url, {
      method: intervention ? 'PATCH' : 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(command),
    })
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setInterventions(null)
      throw new Error(message)
    }

    setInterventions(await response.json() as StudentPlanInterventionsResponse)
    setInterventionsError(null)
    setNotice(intervention ? 'The intervention was updated.' : 'The intervention was added to the annual plan.')
    setError(null)
  }

  const deleteIntervention = async (intervention: StudentPlanIntervention) => {
    if (!planId || !intervention.eTag) {
      throw new Error('Reload the intervention before deleting it.')
    }

    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/interventions/${intervention.id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'If-Match': intervention.eTag },
      },
    )
    if (!response.ok) {
      const message = await readError(response)
      if (response.status === 409) setInterventions(null)
      throw new Error(message)
    }

    setInterventions(await response.json() as StudentPlanInterventionsResponse)
    setInterventionsError(null)
    setNotice('The intervention was deleted.')
    setError(null)
  }

  if (!planId) {
    return (
      <section className="ipp-workspace" aria-labelledby="ipp-workspace-title">
        <div className="ipp-workspace-topbar">
          <button type="button" className="ipp-back-button" onClick={onBackToClassAssignment}>
            <ArrowLeft size={16} /> Class Assignment
          </button>
          <span className="ipp-workspace-status">New annual plan</span>
        </div>
        <article className="ipp-create-card">
          <div className="ipp-create-icon"><FilePlus2 size={28} /></div>
          <span className="eyebrow">Individual Education / Program Plan</span>
          <h2 id="ipp-workspace-title">Create {context.studentName}&apos;s annual plan?</h2>
          <p>This creates one master plan for {context.schoolYear ?? 'the current school year'} and adds the required Student Details and Screener Results modules. Student Conditions and Coding is also added automatically when the student is SPED Coded.</p>
          <dl className="ipp-create-context">
            <div><dt>Student</dt><dd>{context.studentName}</dd></div>
            <div><dt>Grade</dt><dd>{context.grade ?? 'Not recorded'}</dd></div>
            <div><dt>School</dt><dd>{context.schoolName ?? 'Not recorded'}</dd></div>
            <div><dt>Class</dt><dd>{context.courseName ?? 'Not recorded'}</dd></div>
          </dl>
          {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}
          <div className="ipp-create-actions">
            <button type="button" className="outline-button" onClick={onBackToClassAssignment}>Cancel</button>
            <button type="button" className="primary-button" onClick={() => void createPlan()} disabled={creating}>
              {creating ? <RefreshCw className="spin" size={17} /> : <FilePlus2 size={17} />}
              {creating ? 'Creating annual plan…' : 'Create annual plan'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="ipp-workspace" aria-label={`${context.studentName} annual plan`}>
      <div className="ipp-workspace-topbar">
        <button type="button" className="ipp-back-button" onClick={onBackToClassAssignment}>
          <ArrowLeft size={16} /> Class Assignment
        </button>
        <span className="ipp-workspace-status">{context.schoolYear ?? 'Current year'} · Annual plan</span>
      </div>

      {notice ? <div className="ipp-success-banner" role="status"><Check size={17} />{notice}</div> : null}
      {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}

      <section className={`ipp-module-shell${documentsOpen ? ' documents-open' : ''}`} aria-label="Annual plan modules">
        <div className="ipp-module-navigation-heading">
          <div>
            <span className="eyebrow">Plan sections</span>
            <strong>{selectedModules.length} modules in this plan</strong>
          </div>
          <div className="ipp-module-heading-actions ipp-no-print">
            <button
              type="button"
              className={manageOpen ? 'ipp-manage-button active' : 'ipp-manage-button'}
              aria-expanded={manageOpen}
              disabled={documentsOpen}
              title={documentsOpen ? 'Close Compiled documents before managing modules.' : undefined}
              onClick={() => setManageOpen((current) => !current)}
            >
              <PanelsTopLeft size={16} /> Manage modules {manageOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              type="button"
              className={documentsOpen ? 'ipp-documents-button active' : 'ipp-documents-button'}
              aria-expanded={documentsOpen}
              onClick={documentsOpen ? closeDocuments : openDocuments}
            >
              <Files size={16} /> Compiled documents
            </button>
          </div>
        </div>

        {loading && !moduleState ? <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading plan modules…</div> : (
          <nav className="ipp-module-tabs" aria-label="Selected plan modules">
            {selectedModules.map((module) => (
              <button
                type="button"
                key={module.id}
                className={module.id === activeModule?.id ? 'active' : ''}
                aria-current={module.id === activeModule?.id ? 'page' : undefined}
                disabled={documentsOpen}
                title={documentsOpen ? 'Close Compiled documents before changing sections.' : undefined}
                onClick={() => setActiveModuleId(module.id)}
              >
                {module.locked ? <LockKeyhole size={13} aria-label="Locked" /> : null}
                <span>{module.name}</span>
              </button>
            ))}
          </nav>
        )}

        {manageOpen && moduleState ? (
          <div className="ipp-module-manager">
            <div className="ipp-module-manager-heading">
              <div>
                <h3>Choose plan modules</h3>
                <p>Adding or removing a module changes this plan&apos;s structure. Opening a module above does not change the selection.</p>
              </div>
              <label className="ipp-description-toggle">
                <input type="checkbox" checked={showDescriptions} onChange={(event) => setShowDescriptions(event.target.checked)} />
                Show full descriptions
              </label>
            </div>
            <div
              className={`ipp-module-groups${showDescriptions ? ' show-descriptions' : ''}`}
              role="region"
              aria-label="Available plan modules"
              tabIndex={0}
            >
              {moduleGroups.map(([group, modules]) => (
                <section key={group} className="ipp-module-group">
                  <h4>{group}</h4>
                  <div className="ipp-module-options">
                    {modules.map((module) => {
                      const includedInExport = !excludedExportModuleIds.has(module.id)
                      const notesAfterSection = notesAfterSectionModuleIds.has(module.id)
                      return (
                      <article className={`ipp-module-option${module.selected ? ' selected' : ''}`} key={module.id}>
                        <div className="ipp-module-option-copy">
                          <div className="ipp-module-option-title">
                            <strong>{module.name}</strong>
                            {module.locked ? <span><LockKeyhole size={12} /> Locked</span> : module.selected ? <span><Check size={12} /> Included</span> : null}
                          </div>
                          {showDescriptions && (module.frontFacingDescription || module.description) ? (
                            <p>{module.frontFacingDescription || module.description}</p>
                          ) : null}
                          {module.stateReason || (!module.selected && module.locksWhenSelected) ? (
                            <small>{module.stateReason ?? 'Locks when selected by module configuration.'}</small>
                          ) : null}
                        </div>
                        <div className="ipp-module-option-actions">
                            {module.selected ? (
                              <button
                                type="button"
                                className={`ipp-module-export-toggle ${includedInExport ? 'included' : 'excluded'}`}
                                aria-pressed={includedInExport}
                                aria-label={`${module.name}: ${includedInExport ? 'included in' : 'excluded from'} the final document`}
                                title={includedInExport ? 'Included in final document' : 'Excluded from final document'}
                                onClick={() => toggleModuleExport(module.id)}
                              >
                                {includedInExport ? <FileCheck2 size={15} /> : <FileX2 size={15} />}
                              </button>
                            ) : null}
                            {module.selected && sectionNoteModuleNames.has(module.name) ? (
                              <button
                                type="button"
                                className={`ipp-module-notes-toggle ${notesAfterSection ? 'after-section' : 'with-comments'}`}
                                aria-pressed={notesAfterSection}
                                aria-label={`${module.name} notes: ${notesAfterSection ? 'print after this section' : 'print within Teacher Comments and Next Steps'}`}
                                title={notesAfterSection
                                  ? 'Notes print after this section'
                                  : 'Notes print within Teacher Comments and Next Steps'}
                                onClick={() => toggleModuleNotesPlacement(module.id)}
                              >
                                {notesAfterSection ? <StickyNoteCheck size={15} /> : <StickyNoteOff size={15} />}
                              </button>
                            ) : null}
                          {module.selected ? (
                            <button
                              type="button"
                              className="ipp-module-remove"
                              disabled={!module.canRemove || changingModuleId === module.id}
                              onClick={() => void changeModule(module, false)}
                            >
                              {changingModuleId === module.id ? <RefreshCw className="spin" size={15} /> : module.locked ? <LockKeyhole size={15} /> : <Trash2 size={15} />}
                              {module.locked ? 'Required' : 'Remove'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ipp-module-add"
                              disabled={!module.available || changingModuleId === module.id}
                              onClick={() => void changeModule(module, true)}
                            >
                              {changingModuleId === module.id ? <RefreshCw className="spin" size={15} /> : <Plus size={15} />}
                              Add
                            </button>
                          )}
                        </div>
                      </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className={`ipp-document-layout${documentsOpen ? ' documents-open' : ''}`}>
      {activeModule ? (
        <article className="ipp-active-module">
          <header>
            <div className="ipp-active-module-icon">
              {activeModule.name === 'Screener Results'
                ? <ChartNoAxesCombined size={20} />
                : activeModule.name === 'Oral Reading Fluency (ORF)'
                  ? <BookOpen size={20} />
                : activeModule.name === 'Word Study'
                  ? <FileCheck2 size={20} />
                : activeModule.name === 'Empower Reading'
                  ? <Target size={20} />
                : activeModule.name === 'Mathematics'
                  ? <ChartNoAxesCombined size={20} />
                : activeModule.name === 'FMCS Foundations'
                  ? <Target size={20} />
                : activeModule.name === 'Writing Snapshot'
                  ? <Star size={20} />
                : activeModule.name === 'Teacher Comment and Next Steps'
                  ? <StickyNoteCheck size={20} />
                : activeModule.name === 'Intervention Focus'
                  ? <Target size={20} />
                : activeModule.name === 'Student Conditions and Coding'
                  ? <Accessibility size={20} />
                : activeModule.name === 'Signatures'
                  ? <Signature size={20} />
                  : <UserRound size={20} />}
            </div>
            <div>
              <h3>{activeModule.name}</h3>
            </div>
            {activeModule.locked ? <strong><LockKeyhole size={13} /> Locked in plan</strong> : null}
          </header>
          {activeModule.name === 'Student Details' ? (
            <StudentDetailsDocument
              context={context}
              details={moduleState?.details}
              description={activeModuleDescription}
              onUpdateAttendance={() => setAttendanceDialogOpen(true)}
            />
          ) : activeModule.name === 'Screener Results' ? (
            <ScreenerResultsDocument
              description={activeModuleDescription}
              response={screeners}
              loading={screenersLoading}
              error={screenersError}
            />
          ) : activeModule.name === 'Oral Reading Fluency (ORF)' ? (
            <OralReadingFluencyDocument
              description={activeModuleDescription}
              response={oralReadingFluency}
              loading={oralReadingFluencyLoading}
              error={oralReadingFluencyError}
              onAdd={() => openOralReadingFluencyDialog(null)}
              onEdit={openOralReadingFluencyDialog}
            />
          ) : activeModule.name === 'Word Study' ? (
            <WordStudyDocument
              description={activeModuleDescription}
              response={wordStudy}
              loading={wordStudyLoading}
              error={wordStudyError}
              onAdd={() => openWordStudyDialog(null)}
              onEdit={openWordStudyDialog}
            />
          ) : activeModule.name === 'Empower Reading' ? (
            <EmpowerReadingDocument
              description={activeModuleDescription || empowerReading?.sectionDescription || ''}
              response={empowerReading}
              loading={empowerReadingLoading}
              error={empowerReadingError}
              savingGoalId={savingEmpowerGoalId}
              onSave={saveEmpowerProgress}
            />
          ) : activeModule.name === 'Mathematics' ? (
            <MathematicsDocument
              description={activeModuleDescription || mathematics?.sectionDescription || ''}
              preferredGrade={moduleState?.details.gradeAtPlan}
              response={mathematics}
              loading={mathematicsLoading}
              error={mathematicsError}
              savingGoalId={savingMathematicsGoalId}
              onSave={saveMathematicsProgress}
            />
          ) : activeModule.name === 'FMCS Foundations' ? (
            <FmcsFoundationsDocument
              description={activeModuleDescription || fmcsFoundations?.sectionDescription || ''}
              response={fmcsFoundations}
              loading={fmcsFoundationsLoading}
              error={fmcsFoundationsError}
              savingGoalId={savingFmcsGoalId}
              initializingOutcome={initializingFmcsOutcome}
              onSelectOutcome={initializeFmcsOutcomeRecords}
              onSave={saveFmcsProgress}
            />
          ) : activeModule.name === 'Writing Snapshot' ? (
            <WritingSnapshotDocument
              description={activeModuleDescription}
              response={writingSnapshots}
              loading={writingSnapshotsLoading}
              error={writingSnapshotsError}
              onAdd={() => openWritingSnapshotDialog(null)}
              onEdit={openWritingSnapshotDialog}
              contentUrl={writingSnapshotContentUrl}
            />
          ) : activeModule.name === 'Teacher Comment and Next Steps' ? (
            <TeacherCommentsDocument
              description={activeModuleDescription}
              response={teacherComments}
              loading={teacherCommentsLoading}
              error={teacherCommentsError}
              sections={teacherCommentSectionOptions}
              onAdd={() => openTeacherCommentDialog(null)}
              onEdit={openTeacherCommentDialog}
            />
          ) : activeModule.name === 'Student Conditions and Coding' ? (
            <CodingConditionsDocument
              description={activeModuleDescription}
              response={coding}
              loading={codingLoading}
              error={codingError}
              onEdit={() => setCodingDialogOpen(true)}
            />
          ) : activeModule.name === 'Signatures' ? (
            <SignaturesDocument
              description={activeModuleDescription}
              response={signatures}
              loading={signaturesLoading}
              error={signaturesError}
              onAdd={() => openSignatureDialog(null)}
              onEdit={(signature) => openSignatureDialog(signature)}
              onReorder={reorderSignatures}
            />
          ) : activeModule.name === 'Intervention Focus' ? (
            <InterventionFocusDocument
              description={activeModuleDescription}
              response={interventions}
              loading={interventionsLoading}
              error={interventionsError}
              onAdd={() => openInterventionDialog(null)}
              onEdit={(intervention) => openInterventionDialog(intervention)}
            />
          ) : (
            <div className="ipp-module-document-body">
              {activeModuleDescription ? <p className="ipp-module-front-description">{activeModuleDescription}</p> : null}
              <div className="ipp-module-content-placeholder">
                <PanelsTopLeft size={24} />
                <div>
                  <strong>{activeModule.name} is now part of this annual plan.</strong>
                  <span>The section renderer and its governed source records will be connected as that module is migrated from the Power App.</span>
                </div>
              </div>
            </div>
          )}
        </article>
      ) : !loading ? (
        <div className="ipp-module-content-placeholder"><CircleAlert size={22} /><span>No selected module is available to open.</span></div>
      ) : null}

      {documentsOpen ? (
        <CompiledDocumentsPanel
          documents={documents}
          loading={documentsLoading}
          error={documentsError}
          selectedDocumentId={selectedDocumentId}
          onSelect={setSelectedDocumentId}
          onRefresh={() => void loadDocuments()}
          onClose={closeDocuments}
          contentUrl={documentContentUrl}
        />
      ) : null}
      </div>

      {attendanceDialogOpen && moduleState ? (
        <AttendanceDialog
          details={moduleState.details}
          onClose={() => setAttendanceDialogOpen(false)}
          onSave={saveAttendance}
        />
      ) : null}

      {signatureDialogOpen ? (
        <SignatureDialog
          signature={editingSignature}
          options={signatureOptions}
          optionsLoading={signatureOptionsLoading}
          optionsError={signatureOptionsError}
          onRetryOptions={() => void loadSignatureOptions().catch(() => undefined)}
          onClose={() => {
            setSignatureDialogOpen(false)
            setEditingSignature(null)
          }}
          onSave={saveSignature}
          onDelete={deleteSignature}
        />
      ) : null}

      {oralReadingFluencyDialogOpen ? (
        <OralReadingFluencyDialog
          result={editingOralReadingFluency}
          options={oralReadingFluencyOptions}
          optionsLoading={oralReadingFluencyOptionsLoading}
          optionsError={oralReadingFluencyOptionsError}
          onRetryOptions={() => void loadOralReadingFluencyOptions().catch(() => undefined)}
          onClose={() => {
            setOralReadingFluencyDialogOpen(false)
            setEditingOralReadingFluency(null)
          }}
          onSave={saveOralReadingFluency}
          onDelete={deleteOralReadingFluency}
        />
      ) : null}

      {wordStudyDialogOpen ? (
        <WordStudyDialog
          record={editingWordStudy}
          options={wordStudyOptions}
          optionsLoading={wordStudyOptionsLoading}
          optionsError={wordStudyOptionsError}
          onRetryOptions={() => void loadWordStudyOptions().catch(() => undefined)}
          onClose={() => {
            setWordStudyDialogOpen(false)
            setEditingWordStudy(null)
          }}
          onSave={saveWordStudy}
          onDelete={deleteWordStudy}
        />
      ) : null}

      {writingSnapshotDialogOpen ? (
        <WritingSnapshotDialog
          snapshot={editingWritingSnapshot}
          onClose={() => {
            setWritingSnapshotDialogOpen(false)
            setEditingWritingSnapshot(null)
          }}
          onSave={saveWritingSnapshot}
          onDelete={deleteWritingSnapshot}
        />
      ) : null}

      {teacherCommentDialogOpen ? (
        <TeacherCommentDialog
          comment={editingTeacherComment}
          sections={teacherCommentSectionOptions}
          onClose={() => {
            setTeacherCommentDialogOpen(false)
            setEditingTeacherComment(null)
          }}
          onSave={saveTeacherComment}
          onDelete={deleteTeacherComment}
        />
      ) : null}

      {codingDialogOpen && coding ? (
        <CodingConditionsDialog
          response={coding}
          onClose={() => setCodingDialogOpen(false)}
          onSave={saveCoding}
        />
      ) : null}

      {interventionDialogOpen ? (
        <InterventionDialog
          intervention={editingIntervention}
          options={interventionOptions}
          optionsLoading={interventionOptionsLoading}
          optionsError={interventionOptionsError}
          onRetryOptions={() => void loadInterventionOptions().catch(() => undefined)}
          onClose={() => {
            setInterventionDialogOpen(false)
            setEditingIntervention(null)
          }}
          onSave={saveIntervention}
          onDelete={deleteIntervention}
        />
      ) : null}
    </section>
  )
}

function CompiledDocumentsPanel({
  documents,
  loading,
  error,
  selectedDocumentId,
  onSelect,
  onRefresh,
  onClose,
  contentUrl,
}: {
  documents: StudentPlanDocument[]
  loading: boolean
  error: string | null
  selectedDocumentId: string | null
  onSelect: (documentId: string | null) => void
  onRefresh: () => void
  onClose: () => void
  contentUrl: (documentId: string, download: boolean) => string
}) {
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null
  const selectedDocumentDownloadUrl = selectedDocument
    ? `https://fvsdef.crm3.dynamics.com/WebResources/fvsd_ippnotedownload?data=${encodeURIComponent(selectedDocument.id.replaceAll('{', '').replaceAll('}', '').trim())}`
    : null

  return (
    <aside className="ipp-documents-panel ipp-no-print" aria-label="Compiled IEP and IPP documents">
      <header>
        <div>
          <span>Annual plan files</span>
          <h3>{selectedDocument ? selectedDocument.fileName : 'Compiled documents'}</h3>
        </div>
        <button type="button" aria-label="Close compiled documents" onClick={onClose}><X size={18} /></button>
      </header>

      <div className="ipp-documents-panel-body">
        {selectedDocument ? (
          <div className="ipp-document-viewer">
            <div className="ipp-document-viewer-toolbar">
              <button type="button" onClick={() => onSelect(null)}><ArrowLeft size={15} /> All documents</button>
              <span>{selectedDocument.fileName}</span>
            </div>
            <iframe
              src={contentUrl(selectedDocument.id, false)}
              title={`Preview ${selectedDocument.fileName}`}
            />
          </div>
        ) : loading ? (
          <div className="ipp-documents-state"><RefreshCw className="spin" size={22} /><strong>Loading compiled documents…</strong></div>
        ) : error ? (
          <div className="ipp-documents-state error">
            <CircleAlert size={22} />
            <strong>Compiled documents could not be loaded.</strong>
            <span>{error}</span>
            <button type="button" onClick={onRefresh}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : documents.length === 0 ? (
          <div className="ipp-documents-state">
            <Files size={25} />
            <strong>No compiled documents yet</strong>
            <span>PDF exports created for this annual plan will appear here.</span>
          </div>
        ) : (
          <div className="ipp-document-gallery" role="list">
            {documents.map((document) => (
              <button
                type="button"
                className="ipp-document-card"
                key={document.id}
                onClick={() => onSelect(document.id)}
                role="listitem"
              >
                <DocumentFileIcon fileName={document.fileName} mimeType={document.mimeType} />
                <span className="ipp-document-card-copy">
                  <strong>{document.fileName}</strong>
                  {document.description ? <span>{document.description}</span> : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer>
        {selectedDocument ? (
          <a
            className="primary-button"
            href={selectedDocumentDownloadUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} /> Download PDF
          </a>
        ) : (
          <button
            type="button"
            className="primary-button"
            disabled
            title="Document compilation will be connected after the remaining plan modules are complete."
          >
            <FilePlus2 size={16} /> Request document
          </button>
        )}
        <button type="button" className="outline-button" onClick={onClose}>Close</button>
      </footer>
    </aside>
  )
}

function DocumentFileIcon({ fileName, mimeType }: { fileName: string; mimeType: string }) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const type = mimeType === 'application/pdf' || extension === 'pdf'
    ? 'pdf'
    : extension === 'doc' || extension === 'docx'
      ? 'word'
      : extension === 'xls' || extension === 'xlsx'
        ? 'excel'
        : 'file'
  const label = type === 'pdf' ? 'PDF' : type === 'word' ? 'DOC' : type === 'excel' ? 'XLS' : 'FILE'

  return (
    <span className={`ipp-document-card-icon ${type}`} aria-label={`${label} document`}>
      <svg viewBox="0 0 32 40" aria-hidden="true">
        <path d="M6 1.5h13l7 7V38.5H6z" />
        <path d="M19 1.5v7h7" />
      </svg>
      <span>{label}</span>
    </span>
  )
}

function StudentDetailsDocument({ context, details, description, onUpdateAttendance }: {
  context: IppPreviewContext
  details?: StudentPlanDetails
  description: string
  onUpdateAttendance: () => void
}) {
  const display = (value?: string | null) => value?.trim() || '—'
  const rows = [
    ['Student Name', context.studentName, 'ASN', context.studentAsn],
    ['Student Grade', details?.gradeAtPlan ?? context.grade, 'School', details?.schoolAtPlan ?? context.schoolName],
    ['School Year', details?.schoolYear ?? context.schoolYear, 'Course', details?.courseName ?? context.courseName],
    ['Teacher', details?.teacherAtPlan ?? context.teacherName, 'Principal', details?.principalAtPlan],
  ]

  return (
    <div className="ipp-module-document-body ipp-student-details-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <dl className="ipp-student-detail-rows">
        {rows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
          <div className="ipp-student-detail-row" key={leftLabel}>
            <dt>{leftLabel}</dt><dd>{display(leftValue)}</dd>
            <dt>{rightLabel}</dt><dd>{display(rightValue)}</dd>
          </div>
        ))}
      </dl>
      <section className="ipp-attendance" aria-labelledby="ipp-attendance-title">
        <div className="ipp-attendance-heading">
          <h4 id="ipp-attendance-title">Attendance</h4>
          <button type="button" className="ipp-no-print" onClick={onUpdateAttendance}>
            <PencilLine size={13} /> Update attendance
          </button>
        </div>
        <div className="ipp-attendance-grid">
          <div><span>Fall</span><strong>{formatAttendance(details?.fallAttendance)}</strong></div>
          <div><span>Winter</span><strong>{formatAttendance(details?.winterAttendance)}</strong></div>
          <div><span>Spring</span><strong>{formatAttendance(details?.springAttendance)}</strong></div>
        </div>
      </section>
      <footer className="ipp-module-last-updated">Last Updated: {formatPlanDate(details?.modifiedOn)}</footer>
    </div>
  )
}

function CodingConditionsDocument({ description, response, loading, error, onEdit }: {
  description: string
  response: StudentPlanCodingResponse | null
  loading: boolean
  error: string | null
  onEdit: () => void
}) {
  const groups = response
    ? [response.primary, ...response.additionalGroups].filter((group) => group.categoryName)
    : []

  return (
    <div className="ipp-module-document-body ipp-coding-document">
      <div className="ipp-coding-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-no-print" onClick={onEdit} disabled={!response || loading}>
          <PencilLine size={14} /> Update coding and conditions
        </button>
      </div>
      {loading ? (
        <div className="ipp-module-content-placeholder"><RefreshCw className="spin" size={20} /><span>Loading student coding and conditions…</span></div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : groups.length === 0 ? (
        <div className="ipp-module-content-placeholder">
          <Accessibility size={23} />
          <div><strong>No SPED coding is currently recorded.</strong><span>The primary SPED category is synchronized from Student Details.</span></div>
        </div>
      ) : (
        <div className="ipp-coding-groups">
          {groups.map((group) => (
            <section className="ipp-coding-group" key={group.key}>
              <h4>{group.title}</h4>
              <dl>
                <div><dt>Category</dt><dd>{group.categoryName}</dd></div>
                {group.conditions.length > 0 ? (
                  <div><dt>Conditions</dt><dd>{group.conditions.join(', ')}</dd></div>
                ) : null}
              </dl>
              {plainTextFromHtml(group.observations) ? (
                <div className="ipp-coding-observations">
                  <strong>Observations</strong>
                  <p>{plainTextFromHtml(group.observations)}</p>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

type CodingEditorGroup = {
  categoryId: string
  conditions: string[]
  observations: string
}

function CodingConditionsDialog({ response, onClose, onSave }: {
  response: StudentPlanCodingResponse
  onClose: () => void
  onSave: (command: StudentPlanCodingCommand) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [primaryConditions, setPrimaryConditions] = useState([...response.primary.conditions])
  const [groups, setGroups] = useState<CodingEditorGroup[]>(() => [0, 1, 2].map((index) => {
    const group = response.additionalGroups[index]
    return {
      categoryId: group?.categoryId ?? '',
      conditions: [...(group?.conditions ?? [])],
      observations: plainTextFromHtml(group?.observations),
    }
  }))
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const conditionOptions = (categoryId: string | null | undefined, categoryName?: string | null, retained: string[] = []) => {
    const options = response.conditionOptions.filter((condition) => categoryId
      ? condition.categoryId === categoryId
      : condition.categoryName.localeCompare(categoryName ?? '', undefined, { sensitivity: 'accent' }) === 0)
    const names = new Set(options.map((condition) => condition.name))
    const merged = [...options]
    for (const name of retained) {
      if (!names.has(name)) merged.push({ id: name, categoryId, categoryName: categoryName ?? '', name, details: null })
    }
    return merged
  }

  const togglePrimaryCondition = (name: string) => {
    setPrimaryConditions((current) => current.includes(name)
      ? current.filter((condition) => condition !== name)
      : [...current, name])
  }

  const updateGroup = (index: number, update: Partial<CodingEditorGroup>) => {
    setGroups((current) => current.map((group, groupIndex) => groupIndex === index ? { ...group, ...update } : group))
  }

  const toggleGroupCondition = (index: number, name: string) => {
    const current = groups[index]
    updateGroup(index, {
      conditions: current.conditions.includes(name)
        ? current.conditions.filter((condition) => condition !== name)
        : [...current.conditions, name],
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    const commandGroup = (group: CodingEditorGroup): StudentPlanCodingGroupCommand => ({
      categoryId: group.categoryId || null,
      conditions: group.categoryId ? group.conditions : [],
      observations: group.categoryId && group.observations.trim() ? group.observations.trim() : null,
    })
    try {
      setSaving(true)
      await onSave({
        primaryConditions,
        additionalOne: commandGroup(groups[0]),
        additionalTwo: commandGroup(groups[1]),
        additionalThree: commandGroup(groups[2]),
      })
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'Student coding and conditions could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    if (saving) return
    dialogRef.current?.close()
    onClose()
  }

  const renderConditions = (
    options: StudentPlanCodingConditionOption[],
    selected: string[],
    toggle: (name: string) => void,
  ) => options.length > 0 ? (
    <div className="ipp-coding-condition-options">
      {options.map((condition) => (
        <label key={`${condition.id}-${condition.name}`}>
          <input
            type="checkbox"
            checked={selected.includes(condition.name)}
            onChange={() => toggle(condition.name)}
            disabled={saving}
          />
          <span><strong>{condition.name}</strong>{condition.details ? <small>{condition.details}</small> : null}</span>
        </label>
      ))}
    </div>
  ) : <p className="ipp-coding-no-conditions">No governed conditions are configured for this category.</p>

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-coding-dialog"
      aria-labelledby="ipp-coding-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Student Conditions and Coding</span>
            <h2 id="ipp-coding-dialog-title">Update coding and conditions</h2>
          </div>
          <button type="button" aria-label="Close coding and conditions form" onClick={close} disabled={saving}><X size={18} /></button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-coding-dialog-body">
          <p>The primary category is synchronized from Student Details. Select its conditions and add up to three additional category groups.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}

          <section className="ipp-coding-editor-group">
            <div className="ipp-coding-editor-heading"><strong>Primary SPED</strong><span>{response.primary.categoryName ?? 'Not recorded'}</span></div>
            {response.primary.categoryName
              ? renderConditions(
                conditionOptions(response.primary.categoryId, response.primary.categoryName, response.primary.conditions),
                primaryConditions,
                togglePrimaryCondition,
              )
              : <p className="ipp-coding-no-conditions">A primary SPED category has not been synchronized for this student.</p>}
          </section>

          {groups.map((group, index) => {
            if (index > 0 && !groups[index - 1].categoryId) return null
            const category = response.categories.find((item) => item.id === group.categoryId)
            const existingGroup = response.additionalGroups[index]
            return (
              <section className="ipp-coding-editor-group" key={index}>
                <div className="ipp-coding-editor-heading">
                  <strong>{index === 0 ? 'First' : index === 1 ? 'Second' : 'Third'} Additional</strong>
                  {group.categoryId ? <span>{group.conditions.length} conditions selected</span> : null}
                </div>
                <label className="ipp-coding-category-field">
                  <span>SPED Category</span>
                  <select
                    value={group.categoryId}
                    disabled={saving}
                    onChange={(event) => updateGroup(index, { categoryId: event.target.value, conditions: [] })}
                  >
                    <option value="">No additional category</option>
                    {response.categories.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}
                  </select>
                </label>
                {group.categoryId ? (
                  <>
                    <div className="ipp-coding-field-label">Conditions</div>
                    {renderConditions(
                      conditionOptions(
                        group.categoryId,
                        category?.name,
                        existingGroup?.categoryId === group.categoryId ? existingGroup.conditions : [],
                      ),
                      group.conditions,
                      (name) => toggleGroupCondition(index, name),
                    )}
                    <label className="ipp-coding-observations-field">
                      <span>Additional observations</span>
                      <textarea
                        rows={4}
                        value={group.observations}
                        disabled={saving}
                        onChange={(event) => updateGroup(index, { observations: event.target.value })}
                      />
                    </label>
                  </>
                ) : null}
              </section>
            )
          })}
        </div>
        <footer>
          <button type="button" className="outline-button" onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save coding and conditions'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function InterventionDialog({
  intervention,
  options,
  optionsLoading,
  optionsError,
  onRetryOptions,
  onClose,
  onSave,
  onDelete,
}: {
  intervention: StudentPlanIntervention | null
  options: StudentPlanInterventionOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  onRetryOptions: () => void
  onClose: () => void
  onSave: (command: StudentPlanInterventionCommand, intervention: StudentPlanIntervention | null) => Promise<void>
  onDelete: (intervention: StudentPlanIntervention) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [curriculum, setCurriculum] = useState('')
  const [sourceTeacherSectionId, setSourceTeacherSectionId] = useState('')
  const [interventionTypeId, setInterventionTypeId] = useState(intervention?.interventionTypeId ?? '')
  const [dateStarted, setDateStarted] = useState(
    toPlanDateInput(intervention?.dateStarted) || new Date().toISOString().slice(0, 10),
  )
  const [interventionist, setInterventionist] = useState(intervention?.interventionist ?? '')
  const [dateWithdrawn, setDateWithdrawn] = useState(toPlanDateInput(intervention?.dateWithdrawn))
  const [withdrawnReason, setWithdrawnReason] = useState(
    intervention?.withdrawnReason?.toLocaleLowerCase().startsWith('complete')
      ? '1'
      : intervention?.withdrawnReason?.toLocaleLowerCase().startsWith('incomplete') ? '2' : '',
  )
  const [additionalInformation, setAdditionalInformation] = useState(intervention?.additionalInformation ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const editing = intervention !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (!intervention || interventionTypeId || !options) return
    const match = options.interventionTypes.find((option) =>
      option.name.toLocaleLowerCase() === intervention.interventionType.toLocaleLowerCase())
    if (match) setInterventionTypeId(match.id)
  }, [intervention, interventionTypeId, options])

  const visibleSections = options?.studentSections.filter((section) => section.curriculum === curriculum) ?? []
  const visibleTypes = options?.interventionTypes.filter((type) =>
    !options.requiresSourceSection || !curriculum || type.curriculum === curriculum) ?? []
  const selectedType = options?.interventionTypes.find((type) => type.id === interventionTypeId)
  const selectedSection = options?.studentSections.find((section) => section.teacherSectionId === sourceTeacherSectionId)
  const currentInterventionistMissing = Boolean(interventionist)
    && !options?.interventionists.some((option) => option.name === interventionist)

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    try {
      if (!interventionTypeId) throw new Error('Select an Intervention Type.')
      if (!dateStarted) throw new Error('Enter a Date Started.')
      if (!editing && options?.requiresSourceSection && !sourceTeacherSectionId) {
        throw new Error('Select the student\'s Curriculum and Student Section.')
      }
      if (dateWithdrawn && dateWithdrawn < dateStarted) {
        throw new Error('Date Withdrawn cannot be before Date Started.')
      }
      if (dateWithdrawn && !withdrawnReason) {
        throw new Error('Select Completed or Incomplete when a Date Withdrawn is entered.')
      }

      setSaving(true)
      await onSave({
        interventionTypeId,
        dateStarted,
        interventionist: interventionist.trim() || null,
        dateWithdrawn: dateWithdrawn || null,
        withdrawnReason: dateWithdrawn && withdrawnReason ? Number(withdrawnReason) : null,
        additionalInformation: additionalInformation.trim() || null,
        sourceTeacherSectionId: !editing && options?.requiresSourceSection ? sourceTeacherSectionId : null,
      }, intervention)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The intervention could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!intervention || !window.confirm(`Delete ${intervention.interventionType} from this annual plan?`)) return
    setDialogError(null)
    setDeleting(true)
    try {
      await onDelete(intervention)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The intervention could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-intervention-dialog"
      aria-labelledby="ipp-intervention-dialog-title"
      onCancel={(event) => { event.preventDefault(); close() }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Intervention Focus</span>
            <h2 id="ipp-intervention-dialog-title">{editing ? 'Update Intervention' : 'Add Intervention'}</h2>
          </div>
          <button type="button" aria-label="Close intervention form" onClick={close} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-intervention-dialog-body">
          <p>{editing
            ? 'Update the intervention details or record its closure. The original class and curriculum context will remain unchanged.'
            : options?.requiresSourceSection
              ? 'Choose the curriculum and one of this student\'s matching sections. That section supplies the course and teacher context stored with the intervention.'
              : 'The selected Foundation section supplies the course and teacher context stored with this intervention.'}</p>

          {optionsLoading && !options ? (
            <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading intervention choices…</div>
          ) : optionsError && !options ? (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              <span>{optionsError}</span>
              <button type="button" className="outline-button" onClick={onRetryOptions}>Try again</button>
            </div>
          ) : null}
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}

          {options ? (
            <div className="ipp-intervention-fields">
              {!editing && options.requiresSourceSection ? (
                <>
                  <label>
                    <span>Curriculum</span>
                    <select
                      value={curriculum}
                      required
                      onChange={(event) => {
                        setCurriculum(event.target.value)
                        setSourceTeacherSectionId('')
                        setInterventionTypeId('')
                      }}
                    >
                      <option value="">Select curriculum</option>
                      {options.curricula.map((option) => <option value={option} key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Student Section</span>
                    <select
                      value={sourceTeacherSectionId}
                      required
                      disabled={!curriculum}
                      onChange={(event) => setSourceTeacherSectionId(event.target.value)}
                    >
                      <option value="">Select course and teacher</option>
                      {visibleSections.map((section) => (
                        <option value={section.teacherSectionId} key={section.teacherSectionId}>
                          {section.courseName} · {section.teacherName}
                        </option>
                      ))}
                    </select>
                    {selectedSection ? <small>{selectedSection.sectionGroup} · {selectedSection.courseNumber || 'Course number not recorded'}</small> : null}
                  </label>
                </>
              ) : null}

              <label>
                <span>Intervention Type</span>
                <select
                  value={interventionTypeId}
                  required
                  disabled={editing || (!editing && options.requiresSourceSection && !curriculum)}
                  onChange={(event) => setInterventionTypeId(event.target.value)}
                >
                  <option value="">Select intervention type</option>
                  {visibleTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}
                </select>
                {editing && selectedType?.curriculum ? <small>{selectedType.curriculum}</small> : null}
              </label>

              <label>
                <span>Date Started</span>
                <input type="date" value={dateStarted} required onChange={(event) => setDateStarted(event.target.value)} />
              </label>

              <label>
                <span>Interventionist</span>
                <select value={interventionist} onChange={(event) => setInterventionist(event.target.value)}>
                  <option value="">No interventionist selected</option>
                  {currentInterventionistMissing ? <option value={interventionist}>{interventionist}</option> : null}
                  {options.interventionists.map((option) => (
                    <option value={option.name} key={option.display}>{option.display}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date Withdrawn</span>
                <input
                  type="date"
                  value={dateWithdrawn}
                  min={dateStarted || undefined}
                  onChange={(event) => {
                    setDateWithdrawn(event.target.value)
                    if (!event.target.value) setWithdrawnReason('')
                  }}
                />
              </label>

              <label>
                <span>Withdrawn Reason</span>
                <select value={withdrawnReason} disabled={!dateWithdrawn} required={Boolean(dateWithdrawn)} onChange={(event) => setWithdrawnReason(event.target.value)}>
                  <option value="">Select reason</option>
                  <option value="1">Completed</option>
                  <option value="2">Incomplete</option>
                </select>
              </label>

              <label className="full-width">
                <span>Additional Information</span>
                <textarea value={additionalInformation} rows={5} onChange={(event) => setAdditionalInformation(event.target.value)} />
              </label>
            </div>
          ) : null}
        </div>
        <footer>
          {intervention ? (
            <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>
              {deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting || !options}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : editing ? 'Save intervention' : 'Add intervention'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function AttendanceDialog({ details, onClose, onSave }: {
  details: StudentPlanDetails
  onClose: () => void
  onSave: (command: StudentPlanAttendanceCommand) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [fallAttendance, setFallAttendance] = useState(details.fallAttendance?.toString() ?? '')
  const [winterAttendance, setWinterAttendance] = useState(details.winterAttendance?.toString() ?? '')
  const [springAttendance, setSpringAttendance] = useState(details.springAttendance?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const parseAttendance = (value: string, period: string) => {
    if (!value.trim()) return null
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      throw new Error(`${period} Attendance must be a whole number from 0 to 100.`)
    }
    return parsed
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    try {
      const command = {
        fallAttendance: parseAttendance(fallAttendance, 'Fall'),
        winterAttendance: parseAttendance(winterAttendance, 'Winter'),
        springAttendance: parseAttendance(springAttendance, 'Spring'),
      }
      setSaving(true)
      await onSave(command)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'Student attendance could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    if (saving) return
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog"
      aria-labelledby="ipp-attendance-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Student Details</span>
            <h2 id="ipp-attendance-dialog-title">Update Student Attendance</h2>
          </div>
          <button type="button" aria-label="Close attendance form" onClick={close} disabled={saving}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body">
          <p>Enter a whole-number attendance percentage for each reporting period. Leave a field blank when no value is available.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          <div className="ipp-attendance-fields">
            <label>
              <span>Fall Attendance %</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                step="1"
                value={fallAttendance}
                onChange={(event) => setFallAttendance(event.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              <span>Winter Attendance %</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                step="1"
                value={winterAttendance}
                onChange={(event) => setWinterAttendance(event.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              <span>Spring Attendance %</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                step="1"
                value={springAttendance}
                onChange={(event) => setSpringAttendance(event.target.value)}
                disabled={saving}
              />
            </label>
          </div>
        </div>
        <footer>
          <button type="button" className="outline-button" onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save attendance'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function SignatureDialog({ signature, options, optionsLoading, optionsError, onRetryOptions, onClose, onSave, onDelete }: {
  signature: StudentPlanSignatureRecord | null
  options: StudentPlanSignatureOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  onRetryOptions: () => void
  onClose: () => void
  onSave: (command: StudentPlanSignatureCommand, signature: StudentPlanSignatureRecord | null) => Promise<void>
  onDelete: (signature: StudentPlanSignatureRecord) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [recipientType, setRecipientType] = useState(signature?.recipientType ?? 1)
  const [signatoryRole, setSignatoryRole] = useState(signature?.signatoryRole ?? 1)
  const [signatoryName, setSignatoryName] = useState(signature?.signatoryName ?? '')
  const [signatoryEmail, setSignatoryEmail] = useState(signature?.signatoryEmail ?? '')
  const [signatoryOrder, setSignatoryOrder] = useState(String(signature?.signatoryOrder ?? 1))
  const [allowComments, setAllowComments] = useState(signature?.allowComments ?? true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    const normalizedName = signatoryName.trim()
    const normalizedEmail = signatoryEmail.trim()
    const normalizedOrder = Number(signatoryOrder)
    if (!normalizedName) {
      setDialogError('Enter the Signatory Name.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      setDialogError('Enter a valid Signatory Email address.')
      return
    }
    if (!Number.isInteger(normalizedOrder) || normalizedOrder < 1) {
      setDialogError('Signatory Order must be a whole number greater than zero.')
      return
    }

    try {
      setSaving(true)
      await onSave({
        recipientType,
        signatoryRole,
        signatoryName: normalizedName,
        signatoryEmail: normalizedEmail,
        signatoryOrder: normalizedOrder,
        allowComments,
      }, signature)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The signature could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!signature || !window.confirm(`Remove ${signature.signatoryName} from this annual plan?`)) return
    setDialogError(null)
    try {
      setDeleting(true)
      await onDelete(signature)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The signature could not be removed.')
    } finally {
      setDeleting(false)
    }
  }

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-signature-dialog ipp-signature-record-dialog"
      aria-labelledby="ipp-signature-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Signatures</span>
            <h2 id="ipp-signature-dialog-title">{signature ? 'Update Signature' : 'Add Signature'}</h2>
          </div>
          <button type="button" aria-label="Close signature form" onClick={close} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body">
          <p>Assign a recipient and routing order for the annual plan. DocuSign status and dates will be updated by automation.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          {optionsError ? (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} /><span>{optionsError}</span>
              <button type="button" onClick={onRetryOptions}>Retry</button>
            </div>
          ) : null}
          <div className="ipp-signature-fields">
            <label>
              <span>Recipient Type</span>
              <select value={recipientType} onChange={(event) => setRecipientType(Number(event.target.value))} disabled={saving || deleting || optionsLoading || !options}>
                {options?.recipientTypes.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Signatory Role</span>
              <select value={signatoryRole} onChange={(event) => setSignatoryRole(Number(event.target.value))} disabled={saving || deleting || optionsLoading || !options}>
                {options?.signatoryRoles.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Signatory Name</span>
              <input
                type="text"
                autoComplete="name"
                value={signatoryName}
                onChange={(event) => setSignatoryName(event.target.value)}
                disabled={saving || deleting}
                required
              />
            </label>
            <label>
              <span>Signatory Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                value={signatoryEmail}
                onChange={(event) => setSignatoryEmail(event.target.value)}
                disabled={saving || deleting}
                required
              />
            </label>
            <label>
              <span>Signatory Order</span>
              <input type="number" min="1" step="1" value={signatoryOrder} onChange={(event) => setSignatoryOrder(event.target.value)} disabled={saving || deleting} required />
              <small>Controls the DocuSign routing order.</small>
            </label>
            <label className="ipp-signature-checkbox">
              <input type="checkbox" checked={allowComments} onChange={(event) => setAllowComments(event.target.checked)} disabled={saving || deleting} />
              <span>
                Allow Comments
                <small>Adds a comment area to the rendered document and the future DocuSign payload.</small>
              </span>
            </label>
            {signature ? (
              <div className="ipp-signature-record-meta">
                <span>Added order <strong>{signature.signatoryAddedOrder}</strong></span>
                <span>Status <strong>{signature.statusLabel}</strong></span>
                {signature.dateRequested ? <span>Requested <strong>{formatPlanDate(signature.dateRequested)}</strong></span> : null}
                {signature.dateSigned ? <span>Signed <strong>{formatPlanDate(signature.dateSigned)}</strong></span> : null}
              </div>
            ) : null}
          </div>
        </div>
        <footer>
          {signature ? (
            <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>
              {deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          ) : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting || optionsLoading || !options}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : signature ? 'Save signature' : 'Add signature'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

const screenerRows = [
  { assessmentType: 'TOSREC', label: 'TOSREC', subscore: false, towre: false },
  { assessmentType: 'TOWRE', label: 'TOWRE', subscore: false, towre: true },
  { assessmentType: 'TOWRE RW', label: 'Real Word (RW)', subscore: true, towre: true },
  { assessmentType: 'TOWRE NW', label: 'Non Word (NW)', subscore: true, towre: true },
  { assessmentType: 'WRAT-5', label: 'WRAT-5', subscore: false, towre: false },
] as const

const screenerPeriods = ['Fall', 'Winter', 'Spring'] as const

function ScreenerResultsDocument({ description, response, loading, error }: {
  description: string
  response: StudentPlanScreenersResponse | null
  loading: boolean
  error: string | null
}) {
  return (
    <div className="ipp-module-document-body ipp-screener-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <p className="ipp-screener-legend">Standard score · descriptive term · assessment date</p>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading screener results…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : (
        <div className="ipp-screener-table-wrap">
          <table className="ipp-screener-table">
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                {screenerPeriods.map((period) => <th scope="col" key={period}>{period}</th>)}
              </tr>
            </thead>
            <tbody>
              {screenerRows.map((row) => (
                <tr className={row.towre ? 'towre-row' : undefined} key={row.assessmentType}>
                  <th className={row.subscore ? 'subscore' : undefined} scope="row">{row.label}</th>
                  {screenerPeriods.map((period) => {
                    const result = response?.results.find((item) => item.assessmentType === row.assessmentType && item.period === period)
                    const accent = result?.descriptiveTermFill || '#6c8292'
                    return (
                      <td key={period}>
                        {result?.standardScore !== null && result?.standardScore !== undefined ? (
                          <>
                            <div
                              className="ipp-screener-result"
                              style={{ borderColor: accent, backgroundColor: accent, color: result.descriptiveTermFont || '#12243d' }}
                            >
                              <strong>{result.standardScore}</strong>
                              {result.descriptiveTerm ? <span>{result.descriptiveTerm}</span> : null}
                            </div>
                            <small>{formatPlanDate(result.assessmentDate)}</small>
                          </>
                        ) : <span className="ipp-screener-empty">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OralReadingFluencyDocument({ description, response, loading, error, onAdd, onEdit }: {
  description: string
  response: StudentPlanOralReadingFluencyResponse | null
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (result: StudentPlanOralReadingFluencyResult) => void
}) {
  const results = response?.results ?? []

  return (
    <div className="ipp-module-document-body ipp-orf-document">
      <div className="ipp-intervention-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-module-action-button primary ipp-inline-edit ipp-no-print" onClick={onAdd}>
          <Plus size={14} /> Add ORF result
        </button>
      </div>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading oral reading fluency results…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : results.length === 0 ? (
        <div className="ipp-intervention-empty">No oral reading fluency assessments have been recorded.</div>
      ) : (
        <>
          <div className="ipp-orf-table-wrap">
            <table className="ipp-orf-table">
              <thead>
                <tr>
                  <th scope="col">Assessment Date</th>
                  <th scope="col">Level of Reading</th>
                  <th scope="col">Words per Minute</th>
                  <th scope="col">WPM Change</th>
                  <th scope="col" className="ipp-no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const currentDate = result.assessmentDate ? new Date(result.assessmentDate).getTime() : Number.NaN
                  const previous = results.slice(index + 1).find((candidate) => {
                    if (!candidate.assessmentDate || Number.isNaN(currentDate)) return false
                    return new Date(candidate.assessmentDate).getTime() < currentDate
                  })
                  const change = previous ? result.wordsPerMinute - previous.wordsPerMinute : null
                  const readingLevelChanged = previous
                    ? previous.levelOfReading !== result.levelOfReading
                    : false
                  const changeLabel = change === null
                    ? null
                    : (change > 0 ? '↑ +' + change : change < 0 ? '↓ ' + change : '→ 0') + ' WPM'
                  return (
                    <tr key={result.id}>
                      <td>{formatPlanDate(result.assessmentDate)}</td>
                      <td>{result.levelOfReadingLabel}</td>
                      <td><strong className="ipp-orf-score">{result.wordsPerMinute}</strong></td>
                      <td>
                        {changeLabel === null ? (
                          <span className="ipp-orf-first">First result</span>
                        ) : (
                          <div className="ipp-orf-change">
                            <strong>{changeLabel}</strong>
                            {readingLevelChanged ? <small>Reading level changed</small> : null}
                          </div>
                        )}
                      </td>
                      <td className="ipp-no-print">
                        <button type="button" className="ipp-module-action-button" onClick={() => onEdit(result)}>
                          <PencilLine size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="ipp-orf-note">Arrows show the change in words per minute from the previous earlier-dated result with a recorded score. Reading levels may differ between assessments.</p>
        </>
      )}
    </div>
  )
}

function OralReadingFluencyDialog({
  result,
  options,
  optionsLoading,
  optionsError,
  onRetryOptions,
  onClose,
  onSave,
  onDelete,
}: {
  result: StudentPlanOralReadingFluencyResult | null
  options: StudentPlanOralReadingFluencyOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  onRetryOptions: () => void
  onClose: () => void
  onSave: (
    command: StudentPlanOralReadingFluencyCommand,
    result: StudentPlanOralReadingFluencyResult | null,
  ) => Promise<void>
  onDelete: (result: StudentPlanOralReadingFluencyResult) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [assessmentDate, setAssessmentDate] = useState(
    toPlanDateInput(result?.assessmentDate),
  )
  const [levelOfReading, setLevelOfReading] = useState(result ? String(result.levelOfReading) : '')
  const [wordsPerMinute, setWordsPerMinute] = useState(result ? String(result.wordsPerMinute) : '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    const level = Number(levelOfReading)
    const wpm = Number(wordsPerMinute)
    if (!assessmentDate) {
      setDialogError('Enter an Assessment Date.')
      return
    }
    if (!Number.isInteger(level) || !options?.levelsOfReading.some((option) => option.value === level)) {
      setDialogError('Select a valid Level of Reading.')
      return
    }
    if (!Number.isInteger(wpm) || wpm < 0) {
      setDialogError('Words per Minute must be a whole number of zero or greater.')
      return
    }

    try {
      setSaving(true)
      await onSave({ assessmentDate, levelOfReading: level, wordsPerMinute: wpm }, result)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The oral reading fluency result could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!result || !window.confirm('Delete the oral reading fluency result from ' + formatPlanDate(result.assessmentDate) + '?')) return
    setDialogError(null)
    try {
      setDeleting(true)
      await onDelete(result)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The oral reading fluency result could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-intervention-dialog ipp-orf-dialog"
      aria-labelledby="ipp-orf-dialog-title"
      onCancel={(event) => { event.preventDefault(); close() }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Oral Reading Fluency (ORF)</span>
            <h2 id="ipp-orf-dialog-title">{result ? 'Update ORF Result' : 'Add ORF Result'}</h2>
          </div>
          <button type="button" aria-label="Close oral reading fluency form" onClick={close} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-intervention-dialog-body">
          <p>Record the student’s reading level and the number of words read correctly in one minute.</p>
          {optionsLoading && !options ? (
            <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading reading levels…</div>
          ) : optionsError && !options ? (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              <span>{optionsError}</span>
              <button type="button" className="outline-button" onClick={onRetryOptions}>Try again</button>
            </div>
          ) : null}
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          {options ? (
            <div className="ipp-intervention-fields ipp-orf-fields">
              <label>
                <span>Assessment Date</span>
                <input type="date" value={assessmentDate} required onChange={(event) => setAssessmentDate(event.target.value)} />
              </label>
              <label>
                <span>Level of Reading</span>
                <select value={levelOfReading} required onChange={(event) => setLevelOfReading(event.target.value)}>
                  <option value="">Select level of reading</option>
                  {options.levelsOfReading.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Words per Minute</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={wordsPerMinute}
                  required
                  onChange={(event) => setWordsPerMinute(event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
        <footer>
          {result ? (
            <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>
              {deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting || !options}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : result ? 'Save result' : 'Add result'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function WordStudyDocument({ description, response, loading, error, onAdd, onEdit }: {
  description: string
  response: StudentPlanWordStudyResponse | null
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (record: StudentPlanWordStudyRecord) => void
}) {
  const records = response?.records ?? []

  return (
    <div className="ipp-module-document-body ipp-word-study-document">
      <div className="ipp-intervention-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-module-action-button primary ipp-inline-edit ipp-no-print" onClick={onAdd}>
          <Plus size={14} /> Add Word Study record
        </button>
      </div>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Word Study records…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : records.length === 0 ? (
        <div className="ipp-intervention-empty">No Word Study term records have been recorded.</div>
      ) : (
        <div className="ipp-word-study-table-wrap">
          <table className="ipp-word-study-table">
            <thead>
              <tr>
                <th scope="col">Start Date</th>
                <th scope="col">End Date</th>
                <th scope="col">Starting Stage and Skill</th>
                <th scope="col">Finishing Stage and Skill</th>
                <th scope="col" className="ipp-no-print"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatPlanDate(record.termStartDate)}</td>
                  <td>{formatPlanDate(record.termEndDate)}</td>
                  <td>
                    <WordStudyStageDetail
                      name={record.startingLevelName}
                      section={record.startingStageReference}
                      expectedGrade={record.startingExpectedGrade}
                    />
                  </td>
                  <td>
                    {record.finishingLevelName ? (
                      <WordStudyStageDetail
                        name={record.finishingLevelName}
                        section={record.finishingStageReference}
                        expectedGrade={record.finishingExpectedGrade}
                      />
                    ) : <span className="ipp-intervention-dash">—</span>}
                  </td>
                  <td className="ipp-no-print">
                    <button type="button" className="ipp-module-action-button" onClick={() => onEdit(record)}>
                      <PencilLine size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function WordStudyStageDetail({ name, section, expectedGrade }: {
  name: string
  section?: string | null
  expectedGrade?: string | null
}) {
  return (
    <div className="ipp-word-study-stage">
      <strong>{name}</strong>
      {section ? <span>Stage Reference: {section}</span> : null}
      {expectedGrade ? <span>Expected Grade: {expectedGrade}</span> : null}
    </div>
  )
}

function EmpowerReadingDocument({ description, response, loading, error, savingGoalId, onSave }: {
  description: string
  response: StudentPlanEmpowerResponse | null
  loading: boolean
  error: string | null
  savingGoalId: string | null
  onSave: (goal: StudentPlanEmpowerGoal, command: StudentPlanEmpowerProgressCommand) => Promise<void>
}) {
  const foundationLevels = useMemo(
    () => [...new Set((response?.goals ?? []).map((goal) => goal.foundationLevel))],
    [response],
  )
  const [foundationLevel, setFoundationLevel] = useState('')
  const [division, setDivision] = useState('')
  const divisions = useMemo(
    () => [...new Set((response?.goals ?? [])
      .filter((goal) => goal.foundationLevel === foundationLevel)
      .map((goal) => goal.division))],
    [foundationLevel, response],
  )

  useEffect(() => {
    if (!foundationLevels.length) return
    setFoundationLevel((current) => foundationLevels.includes(current) ? current : foundationLevels[0])
  }, [foundationLevels])

  useEffect(() => {
    if (!divisions.length) {
      setDivision('')
      return
    }
    setDivision((current) => divisions.includes(current) ? current : divisions[0])
  }, [divisions])

  const goals = (response?.goals ?? []).filter((goal) =>
    goal.foundationLevel === foundationLevel && goal.division === division)
  const subsection = goals.find((goal) => goal.subsection)?.subsection

  return (
    <div className="ipp-module-document-body ipp-empower-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Empower Reading goals…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : response ? (
        <>
          <div className="ipp-empower-filters ipp-no-print">
            <label>
              <span>Foundation Level</span>
              <select value={foundationLevel} onChange={(event) => setFoundationLevel(event.target.value)}>
                {foundationLevels.map((value) => <option value={value} key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Division</span>
              <select value={division} onChange={(event) => setDivision(event.target.value)}>
                {divisions.map((value) => <option value={value} key={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <section className="ipp-empower-group" aria-labelledby="ipp-empower-group-title">
            <header>
              <div>
                <span>Empower Reading</span>
                <h4 id="ipp-empower-group-title">
                  {[subsection, foundationLevel, division].filter(Boolean).join(' · ')}
                </h4>
              </div>
              <strong>{goals.length} goals</strong>
            </header>

            <div className="ipp-empower-rating-key" aria-label="Empower rating levels">
              {response.levels.map((level) => (
                <div key={level.id} style={{ backgroundColor: level.fillHex, color: level.fontHex }}>
                  <strong>{level.name}</strong>
                  <span>{level.description}</span>
                </div>
              ))}
            </div>

            <div className="ipp-empower-goals">
              {goals.map((goal) => (
                <EmpowerGoalCard
                  key={goal.goalId}
                  goal={goal}
                  levels={response.levels}
                  saving={savingGoalId === goal.goalId}
                  disabled={savingGoalId !== null && savingGoalId !== goal.goalId}
                  onSave={onSave}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function EmpowerGoalCard({ goal, levels, saving, disabled, onSave }: {
  goal: StudentPlanEmpowerGoal
  levels: StudentPlanEmpowerLevelOption[]
  saving: boolean
  disabled: boolean
  onSave: (goal: StudentPlanEmpowerGoal, command: StudentPlanEmpowerProgressCommand) => Promise<void>
}) {
  const [levelId, setLevelId] = useState(goal.currentLevelId ?? '')
  const [dateAchieved, setDateAchieved] = useState(toPlanDateInput(goal.currentDate))
  const [cardError, setCardError] = useState<string | null>(null)

  useEffect(() => {
    setLevelId(goal.currentLevelId ?? '')
    setDateAchieved(toPlanDateInput(goal.currentDate))
    setCardError(null)
  }, [goal.currentDate, goal.currentLevelId, goal.eTag])

  const save = async () => {
    if (!levelId || !dateAchieved) {
      setCardError('Select a rating and Date Achieved.')
      return
    }
    setCardError(null)
    try {
      await onSave(goal, { levelId, dateAchieved })
    } catch (requestError) {
      setCardError(requestError instanceof Error ? requestError.message : 'This goal could not be saved.')
    }
  }

  return (
    <article className="ipp-empower-goal-card">
      <div className="ipp-empower-goal-copy">
        <strong>{goal.name}</strong>
        {goal.description ? <p>{goal.description}</p> : null}
      </div>
      <div className="ipp-empower-progress" aria-label={`${goal.name} progress`}>
        <EmpowerLevelValue
          label="Initial"
          level={goal.initialLevelName}
          date={goal.initialDate}
          fill={goal.initialLevelFillHex}
          font={goal.initialLevelFontHex}
        />
        <span className="ipp-empower-progress-arrow" aria-hidden="true">→</span>
        <EmpowerLevelValue
          label="Current"
          level={goal.currentLevelName}
          date={goal.currentDate}
          fill={goal.currentLevelFillHex}
          font={goal.currentLevelFontHex}
        />
      </div>
      <div className="ipp-empower-entry ipp-no-print">
        <label>
          <span>Level Achieved</span>
          <select value={levelId} disabled={saving || disabled} onChange={(event) => setLevelId(event.target.value)}>
            <option value="">Select goal level</option>
            {levels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
          </select>
        </label>
        <label>
          <span>Date Achieved</span>
          <input
            type="date"
            value={dateAchieved}
            disabled={saving || disabled}
            onChange={(event) => setDateAchieved(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="ipp-module-action-button primary"
          disabled={saving || disabled || !levelId || !dateAchieved}
          onClick={() => void save()}
        >
          {saving ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
          {saving ? 'Saving…' : goal.currentLevelId ? 'Save progress' : 'Add progress'}
        </button>
        {cardError ? <span className="ipp-empower-card-error" role="alert">{cardError}</span> : null}
      </div>
    </article>
  )
}

function EmpowerLevelValue({ label, level, date, fill, font }: {
  label: string
  level?: string | null
  date?: string | null
  fill?: string | null
  font?: string | null
}) {
  return (
    <div className="ipp-empower-level-value">
      <span>{label}</span>
      <strong style={{ backgroundColor: fill ?? '#f4f7f9', color: font ?? '#596f7d' }}>{level ?? '—'}</strong>
      <small>{date ? formatPlanDate(date) : '—'}</small>
    </div>
  )
}

function MathematicsDocument({ description, preferredGrade, response, loading, error, savingGoalId, onSave }: {
  description: string
  preferredGrade?: string | null
  response: StudentPlanMathematicsResponse | null
  loading: boolean
  error: string | null
  savingGoalId: string | null
  onSave: (goal: StudentPlanMathematicsGoal, command: StudentPlanMathematicsProgressCommand) => Promise<void>
}) {
  const outcomes = useMemo(
    () => [...new Set((response?.goals ?? []).map((goal) => goal.outcome))],
    [response],
  )
  const [outcome, setOutcome] = useState('')
  const [grade, setGrade] = useState('')
  const [layout, setLayout] = useState<'single' | 'dual'>('single')
  const grades = useMemo(
    () => [...new Set((response?.goals ?? [])
      .filter((goal) => goal.outcome === outcome)
      .map((goal) => goal.grade))].sort(compareProgressionGrades),
    [outcome, response],
  )

  useEffect(() => {
    if (!outcomes.length) return
    setOutcome((current) => outcomes.includes(current) ? current : outcomes[0])
  }, [outcomes])

  useEffect(() => {
    if (!grades.length) {
      setGrade('')
      return
    }
    setGrade((current) => {
      if (grades.includes(current)) return current
      if (preferredGrade && grades.includes(preferredGrade)) return preferredGrade
      return grades[0]
    })
  }, [grades, preferredGrade])

  const goals = (response?.goals ?? []).filter((goal) => goal.outcome === outcome && goal.grade === grade)
  const gradeDescription = goals.find((goal) => goal.description)?.description ?? ''

  return (
    <div className="ipp-module-document-body ipp-mathematics-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Mathematics goals…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : response ? (
        <>
          <div className="ipp-mathematics-toolbar ipp-no-print">
            <div className="ipp-mathematics-filters">
              <label>
                <span>Outcome</span>
                <select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                  {outcomes.map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Progression Grade</span>
                <select value={grade} onChange={(event) => setGrade(event.target.value)}>
                  {grades.map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="ipp-mathematics-layout-toggle">
              <legend>Visual and document layout</legend>
              <button type="button" className={layout === 'single' ? 'active' : ''} onClick={() => setLayout('single')}>
                Single Value
              </button>
              <button type="button" className={layout === 'dual' ? 'active' : ''} onClick={() => setLayout('dual')}>
                Dual Value
              </button>
            </fieldset>
          </div>

          <section className="ipp-mathematics-entry" aria-labelledby="ipp-mathematics-entry-title">
            <header>
              <div>
                <span>Record progress</span>
                <h4 id="ipp-mathematics-entry-title">{outcome} · {grade}</h4>
              </div>
              <strong>{goals.length} goals</strong>
            </header>
            <div className="ipp-mathematics-entry-list">
              {goals.map((goal) => (
                <MathematicsGoalEntry
                  key={goal.goalId}
                  goal={goal}
                  levels={response.levels}
                  saving={savingGoalId === goal.goalId}
                  disabled={savingGoalId !== null && savingGoalId !== goal.goalId}
                  onSave={onSave}
                />
              ))}
            </div>
          </section>

          <section className="ipp-mathematics-preview" aria-labelledby="ipp-mathematics-preview-title">
            <header>
              <div>
                <span>Plan visual</span>
                <h4 id="ipp-mathematics-preview-title">Mathematics: {outcome}</h4>
                <p>{grade}{gradeDescription ? `: ${gradeDescription}` : ''}</p>
              </div>
              <strong>{layout === 'single' ? 'Current achievement and date' : 'Initial and current achievement'}</strong>
            </header>
            <div className="ipp-mathematics-rating-key">
              {response.levels.map((level) => (
                <span key={level.id} style={{ backgroundColor: level.fillHex, color: level.fontHex }}>{level.name}</span>
              ))}
            </div>
            <div className="ipp-mathematics-card-grid">
              {goals.map((goal) => (
                <MathematicsPreviewCard key={goal.goalId} goal={goal} layout={layout} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function MathematicsGoalEntry({ goal, levels, saving, disabled, onSave }: {
  goal: StudentPlanMathematicsGoal
  levels: StudentPlanMathematicsLevelOption[]
  saving: boolean
  disabled: boolean
  onSave: (goal: StudentPlanMathematicsGoal, command: StudentPlanMathematicsProgressCommand) => Promise<void>
}) {
  const [levelId, setLevelId] = useState(goal.currentLevelId ?? '')
  const [dateAchieved, setDateAchieved] = useState(toPlanDateInput(goal.currentDate))
  const [entryError, setEntryError] = useState<string | null>(null)

  useEffect(() => {
    setLevelId(goal.currentLevelId ?? '')
    setDateAchieved(toPlanDateInput(goal.currentDate))
    setEntryError(null)
  }, [goal.currentDate, goal.currentLevelId, goal.eTag])

  const save = async () => {
    if (!levelId || !dateAchieved) {
      setEntryError('Select a rating and Date Achieved.')
      return
    }
    setEntryError(null)
    try {
      await onSave(goal, { levelId, dateAchieved })
    } catch (requestError) {
      setEntryError(requestError instanceof Error ? requestError.message : 'This Mathematics goal could not be saved.')
    }
  }

  return (
    <article className="ipp-mathematics-entry-row">
      <div>
        <strong>{goal.name}</strong>
        <span>{goal.columnTitle}</span>
      </div>
      <EmpowerLevelValue
        label="Current"
        level={goal.currentLevelName}
        date={goal.currentDate}
        fill={goal.currentLevelFillHex}
        font={goal.currentLevelFontHex}
      />
      <label>
        <span>Level Achieved</span>
        <select value={levelId} disabled={saving || disabled} onChange={(event) => setLevelId(event.target.value)}>
          <option value="">Select goal level</option>
          {levels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
        </select>
      </label>
      <label>
        <span>Date Achieved</span>
        <input type="date" value={dateAchieved} disabled={saving || disabled} onChange={(event) => setDateAchieved(event.target.value)} />
      </label>
      <button
        type="button"
        className="ipp-module-action-button primary"
        disabled={saving || disabled || !levelId || !dateAchieved}
        onClick={() => void save()}
      >
        {saving ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
        {saving ? 'Saving…' : goal.currentLevelId ? 'Save' : 'Add'}
      </button>
      {entryError ? <span className="ipp-empower-card-error" role="alert">{entryError}</span> : null}
    </article>
  )
}

function MathematicsPreviewCard({ goal, layout }: {
  goal: StudentPlanMathematicsGoal
  layout: 'single' | 'dual'
}) {
  return (
    <article className="ipp-mathematics-preview-card">
      <span>{goal.columnTitle}</span>
      <strong>{goal.name}</strong>
      {layout === 'single' ? (
        <EmpowerLevelValue
          label="Current"
          level={goal.currentLevelName}
          date={goal.currentDate}
          fill={goal.currentLevelFillHex}
          font={goal.currentLevelFontHex}
        />
      ) : (
        <div className="ipp-empower-progress">
          <EmpowerLevelValue
            label="Initial"
            level={goal.initialLevelName}
            date={goal.initialDate}
            fill={goal.initialLevelFillHex}
            font={goal.initialLevelFontHex}
          />
          <span className="ipp-empower-progress-arrow" aria-hidden="true">→</span>
          <EmpowerLevelValue
            label="Current"
            level={goal.currentLevelName}
            date={goal.currentDate}
            fill={goal.currentLevelFillHex}
            font={goal.currentLevelFontHex}
          />
        </div>
      )}
    </article>
  )
}

function FmcsFoundationsDocument({ description, response, loading, error, savingGoalId, initializingOutcome, onSelectOutcome, onSave }: {
  description: string
  response: StudentPlanFmcsResponse | null
  loading: boolean
  error: string | null
  savingGoalId: string | null
  initializingOutcome: boolean
  onSelectOutcome: (outcome: string) => Promise<void>
  onSave: (goal: StudentPlanFmcsGoal, command: StudentPlanFmcsProgressCommand) => Promise<void>
}) {
  const outcomes = useMemo(
    () => [...new Set((response?.goals ?? []).map((goal) => goal.outcome))],
    [response],
  )
  const [outcome, setOutcome] = useState('')
  const [layout, setLayout] = useState<'single' | 'multi'>('single')
  const [outcomeError, setOutcomeError] = useState<string | null>(null)

  const selectOutcome = async (nextOutcome: string) => {
    setOutcome(nextOutcome)
    setOutcomeError(null)
    if (!nextOutcome) return
    try {
      await onSelectOutcome(nextOutcome)
    } catch (requestError) {
      setOutcomeError(requestError instanceof Error
        ? requestError.message
        : 'The selected FMCS Foundations Outcome could not be prepared.')
    }
  }

  const goals = (response?.goals ?? []).filter((goal) => goal.outcome === outcome)
  const visualOutcomes = outcomes.filter((candidate) =>
    candidate === outcome || (response?.goals ?? []).some((goal) => goal.outcome === candidate && goal.progressId),
  )

  return (
    <div className="ipp-module-document-body ipp-fmcs-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading FMCS Foundations goals…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : response ? (
        <>
          <div className="ipp-mathematics-toolbar ipp-no-print">
            <div className="ipp-fmcs-filters">
              <label>
                <span>Outcome</span>
                <select value={outcome} disabled={initializingOutcome} onChange={(event) => void selectOutcome(event.target.value)}>
                  <option value="">Select outcome</option>
                  {outcomes.map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </label>
              {initializingOutcome ? <span className="ipp-fmcs-filter-status"><RefreshCw className="spin" size={13} />Preparing goal records…</span> : null}
              {outcomeError ? <span className="ipp-empower-card-error" role="alert">{outcomeError}</span> : null}
            </div>
            <fieldset className="ipp-mathematics-layout-toggle">
              <legend>Visual and document layout</legend>
              <button type="button" className={layout === 'single' ? 'active' : ''} onClick={() => setLayout('single')}>
                Single Value
              </button>
              <button type="button" className={layout === 'multi' ? 'active' : ''} onClick={() => setLayout('multi')}>
                Multi Value
              </button>
            </fieldset>
          </div>

          {outcome ? <section className="ipp-mathematics-entry" aria-labelledby="ipp-fmcs-entry-title">
            <header>
              <div>
                <span>Record progress</span>
                <h4 id="ipp-fmcs-entry-title">{outcome}</h4>
              </div>
              <strong>{goals.length} tasks</strong>
            </header>
            <div className="ipp-mathematics-entry-list">
              {goals.map((goal) => (
                <FmcsGoalEntry
                  key={goal.goalId}
                  goal={goal}
                  levels={response.levels}
                  saving={savingGoalId === goal.goalId}
                  disabled={savingGoalId !== null && savingGoalId !== goal.goalId}
                  onSave={onSave}
                />
              ))}
            </div>
          </section> : (
            <div className="ipp-fmcs-select-prompt">Select an Outcome to add any missing Student - IPP Level records and record progress.</div>
          )}

          <section className="ipp-mathematics-preview" aria-labelledby="ipp-fmcs-preview-title">
            <header>
              <div>
                <span>Plan visual</span>
                <h4 id="ipp-fmcs-preview-title">FMCS Foundations</h4>
              </div>
              <strong>{layout === 'single' ? 'Current achievement and date' : 'Initial and current achievement'}</strong>
            </header>
            <div className="ipp-mathematics-rating-key">
              {response.levels.map((level) => (
                <span key={level.id} style={{ backgroundColor: level.fillHex, color: level.fontHex }}>{level.name}</span>
              ))}
            </div>
            <div className="ipp-fmcs-outcomes">
              {visualOutcomes.map((visualOutcome) => (
                <section className="ipp-fmcs-outcome" key={visualOutcome}>
                  <h5>{visualOutcome}</h5>
                  <div className="ipp-mathematics-card-grid">
                    {response.goals.filter((goal) => goal.outcome === visualOutcome).map((goal) => (
                      <FmcsPreviewCard key={goal.goalId} goal={goal} layout={layout} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function FmcsGoalEntry({ goal, levels, saving, disabled, onSave }: {
  goal: StudentPlanFmcsGoal
  levels: StudentPlanFmcsLevelOption[]
  saving: boolean
  disabled: boolean
  onSave: (goal: StudentPlanFmcsGoal, command: StudentPlanFmcsProgressCommand) => Promise<void>
}) {
  const [levelId, setLevelId] = useState(goal.currentLevelId ?? '')
  const [dateAchieved, setDateAchieved] = useState(toPlanDateInput(goal.currentDate))
  const [entryError, setEntryError] = useState<string | null>(null)

  useEffect(() => {
    setLevelId(goal.currentLevelId ?? '')
    setDateAchieved(toPlanDateInput(goal.currentDate))
    setEntryError(null)
  }, [goal.currentDate, goal.currentLevelId, goal.eTag])

  const save = async () => {
    if (!levelId || !dateAchieved) {
      setEntryError('Select a rating and Date Achieved.')
      return
    }
    setEntryError(null)
    try {
      await onSave(goal, { levelId, dateAchieved })
    } catch (requestError) {
      setEntryError(requestError instanceof Error ? requestError.message : 'This FMCS Foundations goal could not be saved.')
    }
  }

  return (
    <article className="ipp-mathematics-entry-row">
      <div>
        <strong>{goal.name}</strong>
        <span>{goal.description || goal.columnTitle}</span>
      </div>
      <EmpowerLevelValue
        label="Current"
        level={goal.currentLevelName}
        date={goal.currentDate}
        fill={goal.currentLevelFillHex}
        font={goal.currentLevelFontHex}
      />
      <label>
        <span>Level Achieved</span>
        <select value={levelId} disabled={saving || disabled} onChange={(event) => setLevelId(event.target.value)}>
          <option value="">Select goal level</option>
          {levels.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
        </select>
      </label>
      <label>
        <span>Date Achieved</span>
        <input type="date" value={dateAchieved} disabled={saving || disabled} onChange={(event) => setDateAchieved(event.target.value)} />
      </label>
      <button
        type="button"
        className="ipp-module-action-button primary"
        disabled={saving || disabled || !levelId || !dateAchieved}
        onClick={() => void save()}
      >
        {saving ? <RefreshCw className="spin" size={14} /> : <Save size={14} />}
        {saving ? 'Saving…' : goal.currentLevelId ? 'Save' : 'Add'}
      </button>
      {entryError ? <span className="ipp-empower-card-error" role="alert">{entryError}</span> : null}
    </article>
  )
}

function FmcsPreviewCard({ goal, layout }: {
  goal: StudentPlanFmcsGoal
  layout: 'single' | 'multi'
}) {
  return (
    <article className="ipp-mathematics-preview-card">
      <span>{goal.columnTitle}</span>
      <strong>{goal.name}</strong>
      {layout === 'single' ? (
        <EmpowerLevelValue
          label="Current"
          level={goal.currentLevelName}
          date={goal.currentDate}
          fill={goal.currentLevelFillHex}
          font={goal.currentLevelFontHex}
        />
      ) : (
        <div className="ipp-empower-progress">
          <EmpowerLevelValue
            label="Initial"
            level={goal.initialLevelName}
            date={goal.initialDate}
            fill={goal.initialLevelFillHex}
            font={goal.initialLevelFontHex}
          />
          <span className="ipp-empower-progress-arrow" aria-hidden="true">→</span>
          <EmpowerLevelValue
            label="Current"
            level={goal.currentLevelName}
            date={goal.currentDate}
            fill={goal.currentLevelFillHex}
            font={goal.currentLevelFontHex}
          />
        </div>
      )}
    </article>
  )
}

function compareProgressionGrades(left: string, right: string) {
  const order = (value: string) => {
    if (/kindergarten/i.test(value)) return 0
    const match = value.match(/\d+/)
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
  }
  return order(left) - order(right) || left.localeCompare(right)
}

function WordStudyDialog({
  record,
  options,
  optionsLoading,
  optionsError,
  onRetryOptions,
  onClose,
  onSave,
  onDelete,
}: {
  record: StudentPlanWordStudyRecord | null
  options: StudentPlanWordStudyOptionsResponse | null
  optionsLoading: boolean
  optionsError: string | null
  onRetryOptions: () => void
  onClose: () => void
  onSave: (command: StudentPlanWordStudyCommand, record: StudentPlanWordStudyRecord | null) => Promise<void>
  onDelete: (record: StudentPlanWordStudyRecord) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [termStartDate, setTermStartDate] = useState(toPlanDateInput(record?.termStartDate))
  const [startingLevelId, setStartingLevelId] = useState(record?.startingLevelId ?? '')
  const [termEndDate, setTermEndDate] = useState(toPlanDateInput(record?.termEndDate))
  const [finishingLevelId, setFinishingLevelId] = useState(record?.finishingLevelId ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    if (!termStartDate) {
      setDialogError('Enter a Term Starting Date.')
      return
    }
    if (!options?.stages.some((stage) => stage.id === startingLevelId)) {
      setDialogError('Select a valid WTW Starting Level.')
      return
    }
    if (Boolean(termEndDate) !== Boolean(finishingLevelId)) {
      setDialogError('Enter both the Term Ending Date and WTW Ending Level, or leave both blank.')
      return
    }
    if (termEndDate && termEndDate < termStartDate) {
      setDialogError('Term Ending Date cannot be before Term Starting Date.')
      return
    }
    if (finishingLevelId && !options.stages.some((stage) => stage.id === finishingLevelId)) {
      setDialogError('Select a valid WTW Ending Level.')
      return
    }

    try {
      setSaving(true)
      await onSave({
        termStartDate,
        startingLevelId,
        termEndDate: termEndDate || null,
        finishingLevelId: finishingLevelId || null,
      }, record)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The Word Study record could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!record || !window.confirm('Delete the Word Study record starting ' + formatPlanDate(record.termStartDate) + '?')) return
    setDialogError(null)
    try {
      setDeleting(true)
      await onDelete(record)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The Word Study record could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  const stageOption = (stage: StudentPlanWordStudyStageOption) => (
    <option value={stage.id} key={stage.id}>{stage.display}</option>
  )

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-intervention-dialog ipp-word-study-dialog"
      aria-labelledby="ipp-word-study-dialog-title"
      onCancel={(event) => { event.preventDefault(); close() }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Word Study</span>
            <h2 id="ipp-word-study-dialog-title">{record ? 'Update Word Study Record' : 'Add Word Study Record'}</h2>
          </div>
          <button type="button" aria-label="Close Word Study form" onClick={close} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-intervention-dialog-body">
          <p>Record the student’s Words Their Way stage at the beginning and, when available, the end of the term.</p>
          {optionsLoading && !options ? (
            <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Words Their Way stages…</div>
          ) : optionsError && !options ? (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              <span>{optionsError}</span>
              <button type="button" className="outline-button" onClick={onRetryOptions}>Try again</button>
            </div>
          ) : null}
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          {options ? (
            <div className="ipp-intervention-fields ipp-word-study-fields">
              <label>
                <span>Term Starting Date</span>
                <input type="date" value={termStartDate} required onChange={(event) => setTermStartDate(event.target.value)} />
              </label>
              <label>
                <span>WTW Starting Level</span>
                <select value={startingLevelId} required onChange={(event) => setStartingLevelId(event.target.value)}>
                  <option value="">Select starting stage and skill</option>
                  {options.stages.map(stageOption)}
                </select>
              </label>
              <label>
                <span>Term Ending Date</span>
                <input type="date" min={termStartDate || undefined} value={termEndDate} onChange={(event) => setTermEndDate(event.target.value)} />
                <small>Optional until the term is complete.</small>
              </label>
              <label>
                <span>WTW Ending Level</span>
                <select value={finishingLevelId} onChange={(event) => setFinishingLevelId(event.target.value)}>
                  <option value="">Select finishing stage and skill</option>
                  {options.stages.map(stageOption)}
                </select>
                <small>Required when a Term Ending Date is entered.</small>
              </label>
            </div>
          ) : null}
        </div>
        <footer>
          {record ? (
            <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>
              {deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting || !options}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : record ? 'Save record' : 'Add record'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function WritingSnapshotDocument({ description, response, loading, error, onAdd, onEdit, contentUrl }: {
  description: string
  response: StudentPlanWritingSnapshotsResponse | null
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (snapshot: StudentPlanWritingSnapshotRecord) => void
  contentUrl: (snapshotId: string, kind: 'file' | 'image') => string
}) {
  const snapshots = response?.snapshots ?? []

  return (
    <div className="ipp-module-document-body ipp-writing-snapshot-document">
      <div className="ipp-intervention-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-module-action-button primary ipp-inline-edit ipp-no-print" onClick={onAdd}>
          <Plus size={14} /> Add writing snapshot
        </button>
      </div>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Writing Snapshots…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : snapshots.length === 0 ? (
        <div className="ipp-intervention-empty">No writing snapshots have been recorded.</div>
      ) : (
        <div className="ipp-writing-snapshot-list">
          {snapshots.map((snapshot) => (
            <article className="ipp-writing-snapshot-card" key={snapshot.id}>
              <div className="ipp-writing-snapshot-content">
                <p>{plainTextFromHtml(snapshot.description) || 'No Evidence of Development was recorded.'}</p>
                {snapshot.hasWritingSampleImage ? (
                  <figure className="ipp-writing-snapshot-image">
                    <img src={contentUrl(snapshot.id, 'image')} alt={`Writing sample added ${formatPlanDate(snapshot.commentDate)}`} loading="lazy" />
                    <figcaption>Writing sample image</figcaption>
                  </figure>
                ) : null}
                {snapshot.hasWritingSampleFile ? (
                  <a className="ipp-writing-snapshot-file ipp-no-print" href={contentUrl(snapshot.id, 'file')}>
                    <FileText size={19} />
                    <span>
                      <strong>{snapshot.writingSampleFileName || 'Writing sample file'}</strong>
                      <small>Download attached writing sample</small>
                    </span>
                    <Download size={16} />
                  </a>
                ) : null}
              </div>
              <footer>
                <span><strong>Added By:</strong> {snapshot.addedBy || '—'}</span>
                <span><strong>Evidence Date:</strong> {formatPlanDate(snapshot.commentDate)}</span>
                {!snapshot.includeInExport ? <em className="ipp-no-print">Excluded from compiled document</em> : null}
                <button type="button" className="ipp-module-action-button ipp-no-print" onClick={() => onEdit(snapshot)}>
                  <PencilLine size={13} /> Edit
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function WritingSnapshotDialog({ snapshot, onClose, onSave, onDelete }: {
  snapshot: StudentPlanWritingSnapshotRecord | null
  onClose: () => void
  onSave: (
    command: StudentPlanWritingSnapshotCommand,
    snapshot: StudentPlanWritingSnapshotRecord | null,
  ) => Promise<void>
  onDelete: (snapshot: StudentPlanWritingSnapshotRecord) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [commentDate, setCommentDate] = useState(
    toPlanDateInput(snapshot?.commentDate) || new Date().toISOString().slice(0, 10),
  )
  const [evidenceOfDevelopment, setEvidenceOfDevelopment] = useState(snapshot?.description ?? '')
  const [includeInExport, setIncludeInExport] = useState(snapshot?.includeInExport ?? true)
  const [writingSampleFile, setWritingSampleFile] = useState<File | null>(null)
  const [writingSampleImage, setWritingSampleImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  const chooseFile = (file: File | null) => {
    setWritingSampleFile(file)
    if (file) {
      setWritingSampleImage(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const chooseImage = (file: File | null) => {
    setWritingSampleImage(file)
    if (file) {
      setWritingSampleFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    if (!commentDate) {
      setDialogError('Enter a Date of Comment.')
      return
    }
    if (!plainTextFromHtml(evidenceOfDevelopment)) {
      setDialogError('Enter Evidence of Development.')
      return
    }
    if (writingSampleFile && writingSampleFile.size > 20 * 1024 * 1024) {
      setDialogError('Writing Sample File must be 20 MB or smaller.')
      return
    }
    if (writingSampleImage && writingSampleImage.size > 8 * 1024 * 1024) {
      setDialogError('Writing Sample Image must be 8 MB or smaller.')
      return
    }
    if (writingSampleImage && !writingSampleImage.type.startsWith('image/')) {
      setDialogError('Writing Sample Image must use an image file format.')
      return
    }

    try {
      setSaving(true)
      await onSave({
        commentDate,
        evidenceOfDevelopment,
        includeInExport,
        writingSampleFile,
        writingSampleImage,
      }, snapshot)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The Writing Snapshot could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!snapshot || !window.confirm('Delete the Writing Snapshot from ' + formatPlanDate(snapshot.commentDate) + '?')) return
    setDialogError(null)
    try {
      setDeleting(true)
      await onDelete(snapshot)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error
        ? requestError.message
        : 'The Writing Snapshot could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="ipp-attendance-dialog ipp-intervention-dialog ipp-writing-snapshot-dialog"
      aria-labelledby="ipp-writing-snapshot-dialog-title"
      onCancel={(event) => { event.preventDefault(); close() }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Writing Snapshot</span>
            <h2 id="ipp-writing-snapshot-dialog-title">{snapshot ? 'Update Writing Snapshot' : 'Add Writing Snapshot'}</h2>
          </div>
          <button type="button" aria-label="Close Writing Snapshot form" onClick={close} disabled={saving || deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-intervention-dialog-body">
          <p>Capture evidence of the student’s writing development and optionally attach the writing sample.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          <div className="ipp-intervention-fields ipp-writing-snapshot-fields">
            <label>
              <span>Date of Comment</span>
              <input type="date" value={commentDate} required onChange={(event) => setCommentDate(event.target.value)} />
            </label>
            <label className="ipp-writing-snapshot-export-field">
              <span>Compiled Document</span>
              <span className="ipp-writing-snapshot-checkbox">
                <input type="checkbox" checked={includeInExport} onChange={(event) => setIncludeInExport(event.target.checked)} />
                Include this snapshot in the export
              </span>
            </label>
            <label className="full-width">
              <span>Evidence of Development</span>
              <textarea value={evidenceOfDevelopment} required onChange={(event) => setEvidenceOfDevelopment(event.target.value)} />
            </label>
            <label className="ipp-writing-snapshot-upload">
              <span><Paperclip size={14} /> Writing Sample File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <small>PDF or Word, up to 20 MB.{snapshot?.hasWritingSampleFile ? ` Current: ${snapshot.writingSampleFileName || 'attached file'}.` : ''}</small>
            </label>
            <label className="ipp-writing-snapshot-upload">
              <span><ImageIcon size={14} /> Writing Sample Image</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
              />
              <small>Image, up to 8 MB.{snapshot?.hasWritingSampleImage ? ' A writing sample image is currently attached.' : ''}</small>
            </label>
          </div>
          {(writingSampleFile || writingSampleImage) && snapshot && (snapshot.hasWritingSampleFile || snapshot.hasWritingSampleImage) ? (
            <div className="ipp-writing-snapshot-replace-notice">
              <CircleAlert size={15} /> The selected upload will replace the existing writing sample attachment.
            </div>
          ) : null}
        </div>
        <footer>
          {snapshot ? (
            <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>
              {deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : snapshot ? 'Save snapshot' : 'Add snapshot'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

function TeacherCommentsDocument({ description, response, loading, error, sections, onAdd, onEdit }: {
  description: string
  response: StudentPlanTeacherCommentsResponse | null
  loading: boolean
  error: string | null
  sections: StudentPlanModule[]
  onAdd: () => void
  onEdit: (comment: StudentPlanTeacherCommentRecord) => void
}) {
  const comments = response?.comments ?? []
  const sectionOrder = new Map(sections.map((section, index) => [section.id, index]))
  const groupedMap = comments.reduce((groups, comment) => {
    const group = groups.get(comment.sectionId) ?? []
    group.push(comment)
    groups.set(comment.sectionId, group)
    return groups
  }, new Map<string, StudentPlanTeacherCommentRecord[]>())
  const grouped = Array.from(groupedMap.entries())
    .sort(([left], [right]) => (sectionOrder.get(left) ?? 9999) - (sectionOrder.get(right) ?? 9999))

  return (
    <div className="ipp-module-document-body ipp-teacher-comments-document">
      <div className="ipp-intervention-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-module-action-button primary ipp-inline-edit ipp-no-print" onClick={onAdd} disabled={sections.length === 0}>
          <Plus size={14} /> Add comment
        </button>
      </div>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading Teacher Comments…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : comments.length === 0 ? (
        <div className="ipp-intervention-empty">No teacher comments or next steps have been recorded.</div>
      ) : (
        <div className="ipp-teacher-comment-groups">
          {grouped.map(([sectionId, sectionComments]) => (
            <section className="ipp-teacher-comment-group" key={sectionId}>
              <h4>{sectionComments[0]?.sectionName || sections.find((section) => section.id === sectionId)?.name || 'Plan section'}</h4>
              <div className="ipp-teacher-comment-list">
                {sectionComments.map((comment) => (
                  <article className="ipp-teacher-comment-card" key={comment.id}>
                    <div className="ipp-teacher-comment-content">
                      <p>{plainTextFromHtml(comment.commentsAndNextSteps)}</p>
                      {plainTextFromHtml(comment.additionalObservations) ? (
                        <div>
                          <strong>Additional Observations</strong>
                          <p>{plainTextFromHtml(comment.additionalObservations)}</p>
                        </div>
                      ) : null}
                    </div>
                    <footer>
                      <span><strong>Added By:</strong> {comment.addedBy || '—'}</span>
                      <span><strong>Date of Comment:</strong> {formatPlanDate(comment.commentDate)}</span>
                      {!comment.includeInExport ? <em className="ipp-no-print">Excluded from compiled document</em> : null}
                      <button type="button" className="ipp-module-action-button ipp-no-print" onClick={() => onEdit(comment)}>
                        <PencilLine size={13} /> Edit
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function TeacherCommentDialog({ comment, sections, onClose, onSave, onDelete }: {
  comment: StudentPlanTeacherCommentRecord | null
  sections: StudentPlanModule[]
  onClose: () => void
  onSave: (command: StudentPlanTeacherCommentCommand, comment: StudentPlanTeacherCommentRecord | null) => Promise<void>
  onDelete: (comment: StudentPlanTeacherCommentRecord) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [sectionId, setSectionId] = useState(comment?.sectionId ?? sections[0]?.id ?? '')
  const [commentDate, setCommentDate] = useState(
    toPlanDateInput(comment?.commentDate) || new Date().toISOString().slice(0, 10),
  )
  const [commentsAndNextSteps, setCommentsAndNextSteps] = useState(comment?.commentsAndNextSteps ?? '')
  const [additionalObservations, setAdditionalObservations] = useState(comment?.additionalObservations ?? '')
  const [includeInExport, setIncludeInExport] = useState(comment?.includeInExport ?? true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const close = () => {
    if (saving || deleting) return
    dialogRef.current?.close()
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    if (!sections.some((section) => section.id === sectionId)) {
      setDialogError('Select an available plan Section.')
      return
    }
    if (!commentDate) {
      setDialogError('Enter a Date of Comment.')
      return
    }
    if (!plainTextFromHtml(commentsAndNextSteps)) {
      setDialogError('Enter Comments and Next Steps.')
      return
    }
    try {
      setSaving(true)
      await onSave({
        sectionId,
        commentDate,
        commentsAndNextSteps,
        additionalObservations: additionalObservations.trim() || null,
        includeInExport,
      }, comment)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The Teacher Comment could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!comment || !window.confirm('Delete this Teacher Comment and Next Steps record?')) return
    setDialogError(null)
    try {
      setDeleting(true)
      await onDelete(comment)
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'The Teacher Comment could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="ipp-attendance-dialog ipp-intervention-dialog ipp-teacher-comment-dialog" aria-labelledby="ipp-teacher-comment-dialog-title" onCancel={(event) => { event.preventDefault(); close() }}>
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <header>
          <div>
            <span>Teacher Comment and Next Steps</span>
            <h2 id="ipp-teacher-comment-dialog-title">{comment ? 'Update Comment' : 'Add Comment'}</h2>
          </div>
          <button type="button" aria-label="Close Teacher Comment form" onClick={close} disabled={saving || deleting}><X size={18} /></button>
        </header>
        <div className="ipp-attendance-dialog-body ipp-intervention-dialog-body">
          <p>Record comments and next steps against one of the modules selected for this annual plan.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          <div className="ipp-intervention-fields ipp-teacher-comment-fields">
            <label>
              <span>Section</span>
              <select value={sectionId} required onChange={(event) => setSectionId(event.target.value)}>
                <option value="">Select plan section</option>
                {sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}
              </select>
            </label>
            <label>
              <span>Date of Comment</span>
              <input type="date" value={commentDate} required onChange={(event) => setCommentDate(event.target.value)} />
            </label>
            <label className="full-width">
              <span>Comments and Next Steps</span>
              <textarea value={commentsAndNextSteps} required onChange={(event) => setCommentsAndNextSteps(event.target.value)} />
            </label>
            <label className="full-width">
              <span>Additional Observations</span>
              <textarea value={additionalObservations} onChange={(event) => setAdditionalObservations(event.target.value)} />
            </label>
            <label className="full-width ipp-writing-snapshot-export-field">
              <span>Compiled Document</span>
              <span className="ipp-writing-snapshot-checkbox">
                <input type="checkbox" checked={includeInExport} onChange={(event) => setIncludeInExport(event.target.checked)} />
                Include this comment in the export
              </span>
            </label>
          </div>
        </div>
        <footer>
          {comment ? <button type="button" className="ipp-danger-button" onClick={() => void remove()} disabled={saving || deleting}>{deleting ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}{deleting ? 'Deleting…' : 'Delete'}</button> : null}
          <span className="ipp-dialog-footer-spacer" />
          <button type="button" className="outline-button" onClick={close} disabled={saving || deleting}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || deleting || sections.length === 0}>{saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}{saving ? 'Saving…' : comment ? 'Save comment' : 'Add comment'}</button>
        </footer>
      </form>
    </dialog>
  )
}

function SignaturesDocument({ description, response, loading, error, onAdd, onEdit, onReorder }: {
  description: string
  response: StudentPlanSignaturesResponse | null
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (signature: StudentPlanSignatureRecord) => void
  onReorder: (ordered: StudentPlanSignatureRecord[]) => Promise<StudentPlanSignaturesResponse>
}) {
  const [managerOpen, setManagerOpen] = useState(false)
  const [draftSignatures, setDraftSignatures] = useState<StudentPlanSignatureRecord[]>([])
  const [draggedSignatureId, setDraggedSignatureId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  useEffect(() => {
    if (!reordering) setDraftSignatures(response?.signatures ?? [])
  }, [reordering, response])

  const allAssigned = draftSignatures.every((signature) => signature.stateCode === 0 && signature.statusCode === 1)
  const canReorder = draftSignatures.length > 1 && allAssigned && !reordering
  const rendererSignatures = draftSignatures.filter(
    (signature) => signature.statusLabel.toLocaleLowerCase() !== 'cancelled',
  )

  const applyOrder = async (ordered: StudentPlanSignatureRecord[]) => {
    if (!canReorder) return
    const optimistic = ordered.map((signature, index) => ({ ...signature, signatoryOrder: index + 1 }))
    setDraftSignatures(optimistic)
    setReorderError(null)
    setReordering(true)
    try {
      const next = await onReorder(ordered)
      setDraftSignatures(next.signatures)
    } catch (requestError) {
      setDraftSignatures(response?.signatures ?? [])
      setReorderError(requestError instanceof Error ? requestError.message : 'The signature order could not be saved.')
    } finally {
      setReordering(false)
      setDraggedSignatureId(null)
    }
  }

  const moveSignature = (id: string, offset: number) => {
    const currentIndex = draftSignatures.findIndex((signature) => signature.id === id)
    const nextIndex = currentIndex + offset
    if (!canReorder || currentIndex < 0 || nextIndex < 0 || nextIndex >= draftSignatures.length) return
    const ordered = [...draftSignatures]
    const [moved] = ordered.splice(currentIndex, 1)
    ordered.splice(nextIndex, 0, moved)
    void applyOrder(ordered)
  }

  const dropSignature = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = draggedSignatureId || event.dataTransfer.getData('text/plain')
    const sourceIndex = draftSignatures.findIndex((signature) => signature.id === sourceId)
    const targetIndex = draftSignatures.findIndex((signature) => signature.id === targetId)
    if (!canReorder || sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDraggedSignatureId(null)
      return
    }
    const ordered = [...draftSignatures]
    const [moved] = ordered.splice(sourceIndex, 1)
    ordered.splice(targetIndex, 0, moved)
    void applyOrder(ordered)
  }

  return (
    <div className={`ipp-signature-module-layout${managerOpen ? ' manager-open' : ''}`}>
      <div className="ipp-module-document-body ipp-signature-document">
        <div className="ipp-intervention-intro">
          {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
          <button
            type="button"
            className={`ipp-module-action-button primary ipp-inline-edit ipp-no-print${managerOpen ? ' active' : ''}`}
            aria-expanded={managerOpen}
            onClick={() => setManagerOpen((current) => !current)}
          >
            <Signature size={14} /> {managerOpen ? 'Close signature manager' : 'Manage signatures'}
          </button>
        </div>
        {loading && !response ? (
          <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading signatures…</div>
        ) : error ? (
          <div className="error-banner"><CircleAlert size={18} />{error}</div>
        ) : rendererSignatures.length === 0 ? (
          <div className="ipp-intervention-empty ipp-no-print">No signatures have been assigned to this annual plan.</div>
        ) : (
          <div className="ipp-signer-rows">
            {rendererSignatures.map((signer) => (
              <section className="ipp-signer-row" key={signer.id}>
                <div className="ipp-signer-renderer-heading">
                  <p>
                    <span>{signer.signatoryRoleLabel}: </span>
                    <span className="ipp-signer-name" title={`DocuSign email: ${signer.signatoryEmail}`}>
                      {signer.signatoryName}
                    </span>
                  </p>
                </div>
                {signer.allowComments ? (
                  <section className="ipp-parent-comment" aria-label={`${signer.signatoryRoleLabel} comments`}>
                    <div className="ipp-parent-comment-heading"><h4>{signer.signatoryRoleLabel} Comments</h4></div>
                    <div className="ipp-parent-comment-body" />
                  </section>
                ) : null}
                <div className="ipp-signature-lines">
                  <div><span>{signer.signatoryRoleLabel} Signature</span></div>
                  <div>
                    {signer.dateSigned ? <strong>{formatPlanDate(signer.dateSigned)}</strong> : null}
                    <span>Date Signed</span>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {managerOpen ? (
        <aside className="ipp-signature-manager ipp-no-print" aria-label="Manage signatures">
          <header>
            <div>
              <span>DocuSign routing</span>
              <h4>Manage signatures</h4>
            </div>
            <button type="button" aria-label="Close signature manager" onClick={() => setManagerOpen(false)}><X size={17} /></button>
          </header>
          <div className="ipp-signature-manager-toolbar">
            <div>
              <strong>{draftSignatures.length} {draftSignatures.length === 1 ? 'signatory' : 'signatories'}</strong>
              <span>Drag cards to set the routing order.</span>
            </div>
            <button type="button" className="ipp-module-action-button primary" onClick={onAdd}>
              <Plus size={14} /> Add signature
            </button>
          </div>
          {reorderError ? <div className="error-banner"><CircleAlert size={17} />{reorderError}</div> : null}
          {!allAssigned && draftSignatures.length > 1 ? (
            <div className="ipp-signature-order-notice"><LockKeyhole size={14} />Routing order is locked after signature requests begin.</div>
          ) : null}
          {draftSignatures.length === 0 ? (
            <div className="ipp-signature-manager-empty">No signatures have been assigned.</div>
          ) : (
            <div className={`ipp-signature-card-grid${reordering ? ' saving' : ''}`} aria-busy={reordering}>
              {draftSignatures.map((signer, index) => {
                const canEdit = signer.stateCode === 0 && signer.statusCode === 1
                return (
                  <article
                    className={`ipp-signature-card${draggedSignatureId === signer.id ? ' dragging' : ''}`}
                    draggable={canReorder}
                    onDragStart={(event) => {
                      setDraggedSignatureId(signer.id)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', signer.id)
                    }}
                    onDragOver={(event) => {
                      if (canReorder) {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }
                    }}
                    onDrop={(event) => dropSignature(event, signer.id)}
                    onDragEnd={() => setDraggedSignatureId(null)}
                    key={signer.id}
                  >
                    <div className="ipp-signature-card-order">
                      <GripVertical size={17} aria-hidden="true" />
                      <span>{index + 1}</span>
                    </div>
                    <div className="ipp-signature-card-copy">
                      <strong>{signer.signatoryName}</strong>
                      <span>{signer.signatoryRoleLabel} · {signer.recipientTypeLabel}</span>
                      <small>{signer.statusLabel}{signer.allowComments ? ' · Comments allowed' : ''}</small>
                    </div>
                    <div className="ipp-signature-card-actions">
                      <button type="button" aria-label={`Move ${signer.signatoryName} earlier`} disabled={!canReorder || index === 0} onClick={() => moveSignature(signer.id, -1)}>
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" aria-label={`Move ${signer.signatoryName} later`} disabled={!canReorder || index === draftSignatures.length - 1} onClick={() => moveSignature(signer.id, 1)}>
                        <ChevronDown size={14} />
                      </button>
                      {canEdit ? (
                        <button type="button" className="edit" aria-label={`Edit ${signer.signatoryName}`} onClick={() => onEdit(signer)}>
                          <PencilLine size={13} /> Edit
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
              {reordering ? <div className="ipp-signature-order-saving"><RefreshCw className="spin" size={16} />Saving order…</div> : null}
            </div>
          )}
        </aside>
      ) : null}
    </div>
  )
}

function InterventionFocusDocument({ description, response, loading, error, onAdd, onEdit }: {
  description: string
  response: StudentPlanInterventionsResponse | null
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (intervention: StudentPlanIntervention) => void
}) {
  return (
    <div className="ipp-module-document-body ipp-intervention-document">
      <div className="ipp-intervention-intro">
        {description ? <p className="ipp-module-front-description">{description}</p> : <span />}
        <button type="button" className="ipp-module-action-button primary ipp-inline-edit ipp-no-print" onClick={onAdd}>
          <Plus size={14} /> Add intervention
        </button>
      </div>
      {loading && !response ? (
        <div className="ipp-module-loading"><RefreshCw className="spin" size={18} />Loading interventions…</div>
      ) : error ? (
        <div className="error-banner"><CircleAlert size={18} />{error}</div>
      ) : !response || response.interventions.length === 0 ? (
        <div className="ipp-intervention-empty">No interventions have been recorded for this school year.</div>
      ) : (
        <div className="ipp-intervention-table-wrap">
          <table className="ipp-intervention-table">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col className="ipp-no-print" style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Intervention Type</th>
                <th scope="col">Interventionist</th>
                <th scope="col">Date Started</th>
                <th scope="col">Date Withdrawn</th>
                <th scope="col">Withdrawn Reason</th>
                <th scope="col" className="ipp-no-print"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            {response.interventions.map((intervention) => (
              <InterventionTableRows intervention={intervention} onEdit={onEdit} key={intervention.id} />
            ))}
          </table>
        </div>
      )}
    </div>
  )
}

function InterventionTableRows({ intervention, onEdit }: {
  intervention: StudentPlanIntervention
  onEdit: (intervention: StudentPlanIntervention) => void
}) {
  const interventionist = intervention.interventionist?.trim() || intervention.teacher?.trim() || '—'
  const teacher = intervention.teacher?.trim()
  const metadata = [
    ['School', intervention.school],
    ['Grade', intervention.grade],
    ['Curriculum', intervention.curriculum],
    ['Course', intervention.courseName],
    ['Teacher', teacher && teacher.toLocaleLowerCase() !== interventionist.toLocaleLowerCase() ? teacher : null],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
  const reason = intervention.withdrawnReason?.trim()
  const reasonClass = reason?.toLocaleLowerCase() === 'complete' || reason?.toLocaleLowerCase() === 'completed'
    ? ' completed'
    : reason?.toLocaleLowerCase() === 'incomplete' ? ' incomplete' : ''

  return (
    <tbody className="ipp-intervention-entry">
      <tr>
        <th scope="row">{intervention.interventionType}</th>
        <td>{interventionist}</td>
        <td className="date">{formatPlanDate(intervention.dateStarted)}</td>
        <td className="date">{formatPlanDate(intervention.dateWithdrawn)}</td>
        <td>{reason ? <span className={`ipp-withdrawal-reason${reasonClass}`}>{reason}</span> : <span className="ipp-intervention-dash">—</span>}</td>
        <td className="ipp-intervention-actions ipp-no-print">
          <button
            type="button"
            className="ipp-module-action-button"
            aria-label={`Edit ${intervention.interventionType}`}
            onClick={() => onEdit(intervention)}
          >
            <PencilLine size={13} /> Edit
          </button>
        </td>
      </tr>
      {metadata.length > 0 ? (
        <tr className="ipp-intervention-metadata">
          <td colSpan={6}>
            {metadata.map(([label, value]) => <span key={label}><strong>{label}:</strong> {value}</span>)}
          </td>
        </tr>
      ) : null}
      {intervention.additionalInformation?.trim() ? (
        <tr className="ipp-intervention-notes">
          <td colSpan={6}>
            <strong>Additional Information</strong>
            <p>{intervention.additionalInformation}</p>
          </td>
        </tr>
      ) : null}
    </tbody>
  )
}
