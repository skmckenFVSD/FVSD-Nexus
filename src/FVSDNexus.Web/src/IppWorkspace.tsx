import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Accessibility,
  ArrowLeft,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Download,
  FileCheck2,
  Files,
  FilePlus2,
  FileX2,
  LockKeyhole,
  PanelsTopLeft,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Signature,
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

type StudentPlanSignatureDetailsCommand = {
  parentOrGuardianName: string | null
  parentOrGuardianEmail: string | null
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
  const [signatureDetailsDialogOpen, setSignatureDetailsDialogOpen] = useState(false)
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
    setSignatureDetailsDialogOpen(false)
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

  const saveSignatureDetails = async (command: StudentPlanSignatureDetailsCommand) => {
    if (!planId || !moduleState) throw new Error('Reload the plan before updating signature details.')

    const response = await fetch(
      `/api/class-assignments/teacher-sections/${context.teacherSectionId}/students/${context.studentId}/plans/${planId}/signature-details`,
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
        throw new Error(`${message} The current signature details have been reloaded.`)
      }
      throw new Error(message)
    }

    const next = await response.json() as StudentPlanModulesResponse
    setModuleState(next)
    setNotice('Parent or guardian signature details were updated.')
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
              details={moduleState?.details}
              onUpdateSignatureDetails={() => setSignatureDetailsDialogOpen(true)}
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

      {signatureDetailsDialogOpen && moduleState ? (
        <SignatureDetailsDialog
          details={moduleState.details}
          onClose={() => setSignatureDetailsDialogOpen(false)}
          onSave={saveSignatureDetails}
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

function SignatureDetailsDialog({ details, onClose, onSave }: {
  details: StudentPlanDetails
  onClose: () => void
  onSave: (command: StudentPlanSignatureDetailsCommand) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [parentOrGuardianName, setParentOrGuardianName] = useState(details.parentOrGuardianName ?? '')
  const [parentOrGuardianEmail, setParentOrGuardianEmail] = useState(details.parentOrGuardianEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)
    const normalizedName = parentOrGuardianName.trim() || null
    const normalizedEmail = parentOrGuardianEmail.trim() || null
    if (normalizedEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      setDialogError('Enter a valid Parent or Guardian Email address.')
      return
    }

    try {
      setSaving(true)
      await onSave({
        parentOrGuardianName: normalizedName,
        parentOrGuardianEmail: normalizedEmail,
      })
      dialogRef.current?.close()
      onClose()
    } catch (requestError) {
      setDialogError(requestError instanceof Error ? requestError.message : 'Signature details could not be updated.')
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
      className="ipp-attendance-dialog ipp-signature-dialog"
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
            <h2 id="ipp-signature-dialog-title">Update Parent or Guardian Information</h2>
          </div>
          <button type="button" aria-label="Close signature details form" onClick={close} disabled={saving}>
            <X size={18} />
          </button>
        </header>
        <div className="ipp-attendance-dialog-body">
          <p>These details identify the parent or guardian who will review and sign the annual plan.</p>
          {dialogError ? <div className="error-banner" role="alert"><CircleAlert size={18} />{dialogError}</div> : null}
          <div className="ipp-signature-fields">
            <label>
              <span>Parent or Guardian Name</span>
              <input
                type="text"
                autoComplete="name"
                value={parentOrGuardianName}
                onChange={(event) => setParentOrGuardianName(event.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              <span>Parent or Guardian Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                value={parentOrGuardianEmail}
                onChange={(event) => setParentOrGuardianEmail(event.target.value)}
                disabled={saving}
              />
            </label>
          </div>
        </div>
        <footer>
          <button type="button" className="outline-button" onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save signature details'}
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

function SignaturesDocument({ description, details, onUpdateSignatureDetails }: {
  description: string
  details?: StudentPlanDetails
  onUpdateSignatureDetails: () => void
}) {
  const signerRows = [
    { role: 'Parent or Guardian', name: details?.parentOrGuardianName, email: details?.parentOrGuardianEmail },
    { role: 'Principal', name: details?.principalAtPlan, email: null },
  ]

  return (
    <div className="ipp-module-document-body ipp-signature-document">
      {description ? <p className="ipp-module-front-description">{description}</p> : null}
      <section className="ipp-parent-comment" aria-labelledby="ipp-parent-comment-title">
        <div className="ipp-parent-comment-heading">
          <h4 id="ipp-parent-comment-title">Parent or Guardian Comments</h4>
          <button type="button" className="ipp-no-print" onClick={onUpdateSignatureDetails}>
            <PencilLine size={13} /> Update signature details
          </button>
        </div>
        <div className="ipp-parent-comment-body" aria-label="Parent or guardian comments will appear here after signing" />
      </section>
      <div className="ipp-signer-rows">
        {signerRows.map((signer) => (
          <section className="ipp-signer-row" key={signer.role}>
            <p>
              <span>{signer.role}: </span>
              <span
                className="ipp-signer-name"
                title={signer.email?.trim() ? `DocuSign email: ${signer.email.trim()}` : undefined}
              >
                {signer.name?.trim() || '—'}
              </span>
            </p>
            <div className="ipp-signature-lines">
              <div><span>{signer.role} Signature</span></div>
              <div><span>Date Signed</span></div>
            </div>
          </section>
        ))}
      </div>
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
