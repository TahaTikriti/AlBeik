'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The marquee's moving track. Scrolling pushes it: it speeds up with how fast
 * you scroll, runs backwards while you scroll up, and eases back to its
 * cruising speed. Drives the CSS animation's playback rate (brand.css
 * .marquee-track); nothing happens with reduced motion.
 */
export function MarqueeTrack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = ref.current
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let lastY = window.scrollY
    let lastT = performance.now()
    let boost = 0
    let direction = 1
    let frame = 0

    const tick = () => {
      boost *= 0.93
      const animation = track.getAnimations()[0]
      if (boost > 0.02) {
        if (animation) animation.playbackRate = direction * (1 + boost)
        frame = requestAnimationFrame(tick)
      } else {
        if (animation) animation.playbackRate = direction
        frame = 0
      }
    }
    const onScroll = () => {
      const now = performance.now()
      const dy = window.scrollY - lastY
      const speed = Math.abs(dy) / Math.max(now - lastT, 1)
      lastY = window.scrollY
      lastT = now
      if (dy !== 0) direction = dy > 0 ? 1 : -1
      boost = Math.min(boost + speed * 1.6, 9)
      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className="marquee-track">
      {children}
    </div>
  )
}
