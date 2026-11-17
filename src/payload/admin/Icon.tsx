import mark from '@/theme/brand/albeik-mark-original.png'

/** The fez mark in the admin's top bar, on a white tile sized to Payload's 16px slot. */
export function Icon() {
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 16,
        height: 16,
        borderRadius: 3,
        background: '#fff',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- admin chrome */}
      <img src={mark.src} alt="AlBeik" width={8} height={13} style={{ display: 'block' }} />
    </span>
  )
}
