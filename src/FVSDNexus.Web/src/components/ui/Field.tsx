import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type FieldProps = {
  id: string
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ id, label, description, error, required, className, children }: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div
      className={classNames('ui-field', Boolean(error) && 'ui-field--invalid', className)}
      data-description-id={descriptionId}
      data-error-id={errorId}
    >
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required ? <span className="ui-field__required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {description ? <div className="ui-field__description" id={descriptionId}>{description}</div> : null}
      {error ? <div className="ui-field__error" id={errorId} role="alert">{error}</div> : null}
    </div>
  )
}

export function getFieldAria(
  id: string,
  options: { hasDescription?: boolean; hasError?: boolean } = {},
) {
  const describedBy = [
    options.hasDescription ? `${id}-description` : null,
    options.hasError ? `${id}-error` : null,
  ].filter(Boolean).join(' ') || undefined

  return {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': options.hasError || undefined,
  } as const
}
