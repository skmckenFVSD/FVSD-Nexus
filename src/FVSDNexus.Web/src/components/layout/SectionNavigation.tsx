import type { ReactNode } from 'react'
import { classNames } from '../ui/classNames'

export type SectionNavigationItem = {
  id: string
  label: string
  group?: string
  state?: ReactNode
  disabled?: boolean
}

export type SectionNavigationProps = {
  label: string
  items: SectionNavigationItem[]
  activeId: string
  onChange: (id: string) => void
}

export function SectionNavigation({ label, items, activeId, onChange }: SectionNavigationProps) {
  const groups = items.reduce<Map<string, SectionNavigationItem[]>>((result, item) => {
    const group = item.group ?? ''
    const groupItems = result.get(group) ?? []
    groupItems.push(item)
    result.set(group, groupItems)
    return result
  }, new Map())
  return (
    <nav className="ds-section-navigation" aria-label={label}>
      {[...groups.entries()].map(([group, groupItems]) => (
        <div className="ds-section-navigation__group" key={group || 'default'}>
          {group ? <h2>{group}</h2> : null}
          <div>
            {groupItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={classNames('ds-section-navigation__item', item.id === activeId && 'is-active')}
                aria-current={item.id === activeId ? 'page' : undefined}
                disabled={item.disabled}
                onClick={() => onChange(item.id)}
              >
                <span>{item.label}</span>
                {item.state ? <span className="ds-section-navigation__state">{item.state}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
