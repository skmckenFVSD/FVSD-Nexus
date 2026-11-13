import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import type { SemanticTone } from './Badge'
import { classNames } from './classNames'

export type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Exclude<SemanticTone, 'neutral'>
  title?: ReactNode
  action?: ReactNode
}

const icons = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
  danger: CircleX,
}

export function Notice({ tone = 'info', title, action, className, children, ...props }: NoticeProps) {
  const Icon = icons[tone]
  return (
    <div
      {...props}
      className={classNames('ui-notice', `ui-notice--${tone}`, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon className="ui-notice__icon" size={20} aria-hidden="true" />
      <div className="ui-notice__content">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
      {action ? <div className="ui-notice__action">{action}</div> : null}
    </div>
  )
}
