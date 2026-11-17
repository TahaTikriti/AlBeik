import mark from '@/theme/brand/albeik-mark-original.png'

/** The fez mark in the admin's top bar, on a white tile. */
export function Icon() {
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        background: '#fff',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin chrome */}
      <img src={mark.src} alt="AlBeik" width={14} height={23} style={{ display: 'block' }} />
    </span>
  )
}
