import clsx from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, className, as = 'input', rows = 6, ...props },
  ref
) {
  const describedById = props.id ? `${props.id}__help` : undefined
  const Comp = as === 'textarea' ? 'textarea' : 'input'

  return (
    <div className="input-group">
      {label && <label className="input-group__label">{label}</label>}

      <Comp
        ref={ref}
        className={clsx(
          as === 'textarea' ? 'textarea' : 'input',
          { 'input--error': !!error },
          className
        )}
        aria-invalid={!!error}
        aria-describedby={describedById}
        rows={as === 'textarea' ? rows : undefined}
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
