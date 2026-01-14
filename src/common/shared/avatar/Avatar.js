import clsx from 'clsx'

export default function Avatar({ src, alt = 'Avatat', size, className }) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 120,
  }

  return (
    <div className={clsx('avatar', `avatar--${size}`, className)}>
      {src && (
        <img
          alt={alt}
          src={src}
          width={sizeMap[size]}
          height={sizeMap[size]}
          className="abatar__image"
        />
      )}
    </div>
  )
}
