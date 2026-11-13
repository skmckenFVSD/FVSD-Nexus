import { useId } from 'react'
import type { ReactNode } from 'react'

export type PageHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  context?: ReactNode
  actions?: ReactNode
  compact?: boolean
}

export function PageHeader({ eyebrow, title, description, context, actions, compact = false }: PageHeaderProps) {
  const titleId = useId()
  return (
    <header className={compact ? 'ds-page-header ds-page-header--compact' : 'ds-page-header'} aria-labelledby={titleId}>
      <div className="ds-page-header__copy">
        {eyebrow ? <div className="ds-page-header__eyebrow">{eyebrow}</div> : null}
        <h1 id={titleId}>{title}</h1>
        {context ? <div className="ds-page-header__context">{context}</div> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ds-page-header__actions">{actions}</div> : null}
    </header>
  )
}
