import clsx from 'clsx'

const FALLBACK = '/images/avatar.png'

export default function Avatar({ src, alt = 'Avatar', size = 'md', className }) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 120,
  }

  const safeSrc = (src || '').trim() || FALLBACK
  const isGoogle = safeSrc.includes('lh3.googleusercontent.com')

  return (
    <div className={clsx('avatar', `avatar--${size}`, className)}>
      <img
        alt={alt}
        src={safeSrc}
        width={sizeMap[size]}
        height={sizeMap[size]}
        className="avatar__image"
        loading="eager"
        decoding="async"
        {...(isGoogle ? { referrerPolicy: 'no-referrer', crossOrigin: 'anonymous' } : {})}
        onError={(e) => {
          if (e.currentTarget.src !== window.location.origin + FALLBACK) {
            e.currentTarget.src = FALLBACK
          }
        }}
      />
    </div>
  )
}

