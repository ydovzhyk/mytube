import clsx from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  const describedById = props.id ? `${props.id}__help` : undefined

  return (
    <div className="input-group">
      {label && <label className="input-group__label">{label}</label>}

      <input
        ref={ref}
        className={clsx('input', { 'input--error': !!error }, className)}
        aria-invalid={!!error}
        aria-describedby={describedById}
        {...props}
      />

      <span
        id={describedById}
        className={clsx('input-group__help', { 'input-group__help--error': !!error })}
      >
        {error ? error : hint ? hint : '\u00A0'}
      </span>
    </div>
  )
})

export default Input
