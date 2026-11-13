import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { classNames } from '../ui/classNames'

export type ContextDrawerProps = {
  open: boolean
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  pinned?: boolean
  onClose: () => void
  className?: string
}

export function ContextDrawer({ open, title, description, children, footer, pinned = false, onClose, className }: ContextDrawerProps) {
  const titleId = useId()
  const descriptionId = useId()
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open || pinned) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open, pinned])

  if (!open) return null

  return (
    <aside
      ref={drawerRef}
      className={classNames('ds-context-drawer', pinned && 'ds-context-drawer--pinned', className)}
      role={pinned ? 'complementary' : 'dialog'}
      aria-modal={pinned ? undefined : true}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <header className="ds-context-drawer__header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </div>
        <Button variant="ghost" size="small" icon={<X size={18} />} aria-label="Close context panel" onClick={onClose} />
      </header>
      <div className="ds-context-drawer__body">{children}</div>
      {footer ? <footer className="ds-context-drawer__footer">{footer}</footer> : null}
    </aside>
  )
}
