/**
 * Shared semantic contract for interactive module views and compiled documents.
 *
 * Adapters build this model from governed records. Screen and document renderers
 * consume the same content model, while controls, dialogs and other interactive
 * state remain outside it and can never leak into a compiled document.
 */

export type ModuleValueTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'descriptive-term'

export type ModuleValue = {
  label: string
  value: string | number | null
  supplementaryText?: string
  tone?: ModuleValueTone
  descriptiveTerm?: {
    name: string
    fill: string
    foreground: string
  }
}

export type ModuleRecord = {
  id: string
  heading?: string
  description?: string
  values: ModuleValue[]
}

export type ModuleSection = {
  id: string
  heading?: string
  description?: string
  records: ModuleRecord[]
}

export type ModulePresentationModel = {
  moduleId: string
  title: string
  description?: string
  asOfText?: string
  emptyMessage: string
  sections: ModuleSection[]
  notes?: ModuleRecord[]
}

export type ModulePresentationContext = {
  locale: string
  schoolYear: string
  generatedAt: Date
}

export interface ModulePresentationAdapter<TSource> {
  toPresentationModel(source: TSource, context: ModulePresentationContext): ModulePresentationModel
}

export function hasModuleContent(model: ModulePresentationModel): boolean {
  return model.sections.some((section) => section.records.length > 0)
}

export function assertDocumentSafeModule(model: ModulePresentationModel): ModulePresentationModel {
  if (!model.moduleId.trim()) throw new Error('A module presentation requires a module identifier.')
  if (!model.title.trim()) throw new Error('A module presentation requires a title.')
  if (!model.emptyMessage.trim()) throw new Error('A module presentation requires an empty-state message.')
  return model
}
