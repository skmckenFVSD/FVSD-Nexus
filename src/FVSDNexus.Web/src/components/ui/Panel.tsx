import { useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'

export type PanelProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  elevation?: 'none' | 'small' | 'medium'
}

export function Panel({
  title,
  description,
  actions,
  elevation = 'none',
  className,
  children,
  ...props
}: PanelProps) {
  const generatedId = useId()
  const headingId = title ? `${generatedId}-title` : undefined

  return (
    <section
      {...props}
      className={classNames('ui-panel', `ui-panel--elevation-${elevation}`, className)}
      aria-labelledby={headingId}
    >
      {title || description || actions ? (
        <header className="ui-panel__header">
          <div>
            {title ? <h2 id={headingId}>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="ui-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-panel__body">{children}</div>
    </section>
  )
}
