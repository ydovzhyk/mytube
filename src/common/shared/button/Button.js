import clsx from 'clsx'

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isIcon = false,
  fullWidth = false,
  height,
  leftIcon,
  className,
  children,
  disabled,
  style,
  ...props
}) {
  return (
    <button
      className={clsx(
        'button',
        `button--${variant}`,
        `button--${size}`,
        {
          'button--loading': isLoading,
          'button--icon': isIcon,
          'button--full': fullWidth,
        },
        className
      )}
      style={{
        ...(height ? { height } : null),
        ...style,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="button__spinner">⏳</span>
          <span className="button__text">{children}</span>
        </>
      ) : (
        <>
          {leftIcon ? <span className="button__icon">{leftIcon}</span> : null}
          <span className="button__text">{children}</span>
        </>
      )}
    </button>
  )
}
