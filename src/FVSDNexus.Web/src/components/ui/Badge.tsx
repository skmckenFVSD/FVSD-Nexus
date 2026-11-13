import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'

export type SemanticTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: SemanticTone
  icon?: ReactNode
}

export function Badge({ tone = 'neutral', icon, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={classNames('ui-badge', `ui-badge--${tone}`, className)}>
      {icon}
      <span>{children}</span>
    </span>
  )
}
