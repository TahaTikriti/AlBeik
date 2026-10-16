'use client'

import { useEffect, useRef, useState } from 'react'

import type { VideoVM } from '@/lib/data/types'

/**
 * A silent loop over the hero photo, which stays underneath as its poster.
 * The video is only requested after the page has loaded (the photo stays the
 * largest paint), fades in once it is actually playing, pauses off-screen,
 * and never starts for reduced motion or data saving.
 */
export function HeroLoop({ video, className = '' }: { video: VideoVM; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

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
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onPlaying={() => setPlaying(true)}
      className={`transition-opacity duration-(--duration-slow) ${playing ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
