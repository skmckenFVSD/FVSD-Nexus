import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { classNames } from './classNames'

type StateProps = {
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, children, action, compact }: StateProps) {
  return (
    <div className={classNames('ui-state', compact && 'ui-state--compact')}>
      <Inbox aria-hidden="true" />
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
      {action}
    </div>
  )
}

export function LoadingState({ title, children, compact }: StateProps) {
  return (
    <div className={classNames('ui-state', compact && 'ui-state--compact')} role="status" aria-live="polite">
      <LoaderCircle className="ui-state__spinner" aria-hidden="true" />
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
    </div>
  )
}

export function ErrorState({ title, children, action, compact }: StateProps) {
  return (
    <div className={classNames('ui-state', 'ui-state--error', compact && 'ui-state--compact')} role="alert">
      <CircleAlert aria-hidden="true" />
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
      {action}
    </div>
  )
}
