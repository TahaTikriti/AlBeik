'use client'

import { useEffect } from 'react'

/**
 * A warm glow that follows the pointer across dish cards ([data-spotlight],
 * styled in brand.css). One listener for the whole page; mouse and trackpad
 * only, since touch has no hover.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>('[data-spotlight]')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      card.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])
  return null
}
