export const viewportBreakpoints = {
  small: 600,
  medium: 900,
  large: 1200,
  wide: 1400,
} as const

export const workspaceContainerBreakpoints = {
  standard: 720,
  spacious: 1000,
} as const

export type ViewportBand = 'compact' | 'small' | 'medium' | 'large' | 'wide'
export type WorkspaceContainerState = 'narrow' | 'standard' | 'spacious'

export function getViewportBand(width: number): ViewportBand {
  if (width >= viewportBreakpoints.wide) return 'wide'
  if (width >= viewportBreakpoints.large) return 'large'
  if (width >= viewportBreakpoints.medium) return 'medium'
  if (width >= viewportBreakpoints.small) return 'small'
  return 'compact'
}

export function getWorkspaceContainerState(width: number): WorkspaceContainerState {
  if (width >= workspaceContainerBreakpoints.spacious) return 'spacious'
  if (width >= workspaceContainerBreakpoints.standard) return 'standard'
  return 'narrow'
}

export const viewportQueries = {
  small: `(min-width: ${viewportBreakpoints.small}px)`,
  medium: `(min-width: ${viewportBreakpoints.medium}px)`,
  large: `(min-width: ${viewportBreakpoints.large}px)`,
  wide: `(min-width: ${viewportBreakpoints.wide}px)`,
} as const
