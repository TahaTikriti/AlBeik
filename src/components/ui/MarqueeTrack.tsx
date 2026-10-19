'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The marquee's moving track. Scrolling pushes it: it speeds up with how fast
 * you scroll, runs backwards while you scroll up, and eases back to its
 * cruising speed. Drives the CSS animation's playback rate (brand.css
 * .marquee-track); nothing happens with reduced motion.
 *
 * Kept cheap for slow phones: it only listens while the strip is on screen,
 * and the speed moves in half steps through updatePlaybackRate, so a swipe
 * makes a handful of changes rather than one every frame (each change
 * re-syncs the animation).
 */
export function MarqueeTrack({
  children,
  reverse = false,
}: {
  children: ReactNode
  /** Runs the other way (and still flips while you scroll up). */
  reverse?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = ref.current
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = track.getAnimations()[0]
    if (!animation) return

    const base = reverse ? -1 : 1
    // Played backwards, an animation stops dead at time zero. Start the clock
    // a thousand loops in, same phase, so reversing never gets there.
    const loop = Number(animation.effect?.getComputedTiming().duration) || 1
    animation.currentTime = loop * 1000 + (Number(animation.currentTime) % loop)
    // A reversed track runs backwards from the start, before any scroll.
    animation.playbackRate = base

    let lastY = window.scrollY
    let lastT = performance.now()
    let boost = 0
    let direction = base
    let frame = 0
    let applied = base

    const apply = () => {
      const rate = direction * (Math.round((1 + boost) * 2) / 2)
      if (rate !== applied) {
        applied = rate
        animation.updatePlaybackRate(rate)
      }
    }
    const tick = () => {
      boost *= 0.92
      if (boost < 0.1) boost = 0
      apply()
      frame = boost ? requestAnimationFrame(tick) : 0
    }
    const onScroll = () => {
      const now = performance.now()
      const dy = window.scrollY - lastY
      const speed = Math.abs(dy) / Math.max(now - lastT, 1)
      lastY = window.scrollY
      lastT = now
      if (dy !== 0) direction = (dy > 0 ? 1 : -1) * base
      boost = Math.min(boost + speed * 1.6, 9)
      if (!frame) frame = requestAnimationFrame(tick)
    }

    // Only react while the strip can be seen.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        lastY = window.scrollY
        lastT = performance.now()
        window.addEventListener('scroll', onScroll, { passive: true })
      } else {
        window.removeEventListener('scroll', onScroll)
        cancelAnimationFrame(frame)
        frame = 0
        boost = 0
        apply()
      }
    })
    observer.observe(track)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [reverse])

  return (
    <div ref={ref} className="marquee-track">
      {children}
    </div>
  )
}
