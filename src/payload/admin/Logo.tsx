import horizontal from '@/theme/brand/albeik-logo-horizontal-original.png'

/** The login screen shows AlBeik's own logo, on white as the brand asks. */
export function Logo() {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--style-radius-m)',
        background: '#fff',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin chrome, no optimisation needed */}
      <img
        src={horizontal.src}
        alt="AlBeik"
        width={220}
        height={120}
        style={{ display: 'block' }}
      />
    </span>
  )
}
