import Image from 'next/image'

import type { ImageVM } from '@/lib/data/types'

/**
 * poc/street brand motifs, from AlBeik's Instagram rebrand: the white
 * mustache, the red fez (tarboush), flip-clock numerals, smoke and steam.
 * All inline SVG/CSS: no image requests.
 */

type SvgProps = { className?: string }

/** The AlBeik mustache. Inherits the text color. */
export function Mustache({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 200 50" className={className} aria-hidden fill="currentColor">
      <path d="M100 18C108 8 122 6 134 12C146 18 158 24 170 20C180 17 186 10 184 2C194 12 192 28 178 36C160 46 134 46 118 38C110 34 104 32 100 34C96 32 90 34 82 38C66 46 40 46 22 36C8 28 6 12 16 2C14 10 20 17 30 20C42 24 54 18 66 12C78 6 92 8 100 18Z" />
    </svg>
  )
}

/** The red fez (tarboush) with its black tassel. */
export function Fez({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <path d="M22 104L34 34C34 27 86 27 86 34L98 104C98 115 22 115 22 104Z" fill="#e1251b" />
      <path d="M70 29C80 30 86 32 86 34L98 104C98 110 89 113 76 114Z" fill="#a8130b" opacity=".7" />
      <path
        d="M40 40C41 64 38 86 33 100"
        stroke="#fff"
        strokeOpacity=".18"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M23 98C40 106 80 106 97 98L98 104C98 115 22 115 22 104Z" fill="#000" opacity=".18" />
      <ellipse cx="60" cy="33" rx="26" ry="6" fill="#c11a11" />
      <path
        d="M60 32C74 28 88 32 91 46"
        stroke="#111"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="60" cy="32" r="3.5" fill="#111" />
      <path
        d="M90 45C94 45 96 49 96 53L99 80C96 84 89 84 86 80L88 53C88 49 87 46 90 45Z"
        fill="#111"
      />
      <path d="M89 56L88 80M92.5 56L93 82M96 56L97.5 80" stroke="#3a3a3a" strokeWidth="1" />
    </svg>
  )
}

export function Logo({ name, image }: { name: string; image: ImageVM | null }) {
  if (image) {
    return (
      <Image
        src={image.url}
        alt={name}
        width={image.width}
        height={image.height}
        sizes="160px"
        className="h-9 w-auto"
        preload
      />
    )
  }
  return (
    <span className="flex items-center gap-2">
      <Mustache className="h-[0.9rem] w-auto text-white" />
      <span className="font-display text-[1.65rem] leading-none tracking-[0.02em] uppercase">
        {name}
      </span>
    </span>
  )
}

/** Hairline, mustache, hairline. */
export function Divider() {
  return (
    <div className="mx-auto flex max-w-content items-center gap-5 px-gutter text-red" aria-hidden>
      <span className="h-px flex-1 bg-current opacity-50" />
      <Mustache className="h-5 w-auto" />
      <span className="h-px flex-1 bg-current opacity-50" />
    </div>
  )
}

/** Split-flap numerals, like the "02 DAYS TO TASTEBUD TANTALIZATION" posts. */
export function FlipDigits({ value, className = '' }: { value: string; className?: string }) {
  return (
    <span className={`flip ${className}`} aria-hidden>
      {value.split('').map((digit, i) => (
        <span key={i} className="flip-tile">
          {digit}
        </span>
      ))}
    </span>
  )
}

/** Round "100% HALAL" sticker. */
export function HalalSticker({ className = '' }: SvgProps) {
  return (
    <span className={`sticker ${className}`} aria-hidden>
      <span className="font-display text-[1.9em] leading-[0.8]">100%</span>
      <span className="font-display text-[1.25em] leading-[0.9] tracking-[0.06em]">HALAL</span>
    </span>
  )
}

/** Slow drifting smoke behind a section. */
export function Smoke({ className = '' }: SvgProps) {
  return <span className={`smoke ${className}`} aria-hidden />
}

/** Steam rising off a dish. */
export function Steam({ className = '' }: SvgProps) {
  return (
    <span className={`steam ${className}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}

export function Loader() {
  return <Fez className="loader-fez h-16 w-auto" />
}

export function NotFoundArt() {
  return (
    <div className="relative mx-auto w-48">
      <Smoke className="opacity-80" />
      <Fez className="fez-bob relative w-full -rotate-12" />
    </div>
  )
}
