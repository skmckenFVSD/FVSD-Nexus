import type { ReactNode } from 'react'
import { classNames } from '../ui/classNames'

export type ViewportShellProps = {
  navigation: ReactNode
  children: ReactNode
  navigationCollapsed?: boolean
  className?: string
}

export function ViewportShell({ navigation, children, navigationCollapsed = false, className }: ViewportShellProps) {
  return (
    <div className={classNames('ds-shell', navigationCollapsed && 'ds-shell--rail', className)}>
      <aside className="ds-shell__navigation">{navigation}</aside>
      <main className="ds-shell__main container-page">{children}</main>
    </div>
  )
}

export type NavigationFrameProps = {
  brand: ReactNode
  destinations: ReactNode
  footer?: ReactNode
}

export function NavigationFrame({ brand, destinations, footer }: NavigationFrameProps) {
  return (
    <div className="ds-navigation-frame">
      <div className="ds-navigation-frame__brand">{brand}</div>
      <div className="ds-navigation-frame__destinations">{destinations}</div>
      {footer ? <div className="ds-navigation-frame__footer">{footer}</div> : null}
    </div>
  )
}
