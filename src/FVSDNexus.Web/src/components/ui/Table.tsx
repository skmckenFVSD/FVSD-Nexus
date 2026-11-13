import type { TableHTMLAttributes } from 'react'
import { classNames } from './classNames'

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  caption: string
  stickyHeader?: boolean
}

export function Table({ caption, stickyHeader = false, className, children, ...props }: TableProps) {
  return (
    <div className="ui-table-region" tabIndex={0} role="region" aria-label={caption}>
      <table
        {...props}
        className={classNames('ui-table', stickyHeader && 'ui-table--sticky-header', className)}
      >
        <caption className="visually-hidden">{caption}</caption>
        {children}
      </table>
    </div>
  )
}
