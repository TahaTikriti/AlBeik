'use client'

import { useEffect, useRef } from 'react'

import type { VideoVM } from '@/lib/data/types'

/**
 * The hero's silent loop, on its own: the video shows its poster (the
 * loop's first frame) until it plays, so playback starts without a seam and
 * nothing else ever shows behind it. The video itself is only requested
 * after the page has loaded, pauses off-screen, and never starts for reduced
 * motion or data saving (the poster stays).
 */
export function HeroLoop({ video, className = '' }: { video: VideoVM; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || saveData) return

    let visible = true
    const play = () => {
      if (visible) el.play().catch(() => {})
    }
    const start = () => {
      el.src = video.url
      play()
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      if (!el.src) return
      if (visible) play()
      else el.pause()
    })
    observer.observe(el)
    return () => {
      window.removeEventListener('load', start)
      observer.disconnect()
    }
  }, [video.url])

  return (
    <video
      ref={ref}
      poster={video.poster ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-label={video.alt}
      className={className}
    />
  )
}
