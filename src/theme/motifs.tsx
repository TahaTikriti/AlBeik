import Image from 'next/image'

import type { ImageVM } from '@/lib/data/types'

/**
 * poc/app brand slots: the same mustache and fez as the rebrand, used
 * lightly on a clean, app-like surface.
 */

type SvgProps = { className?: string }

export function Mustache({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 200 50" className={className} aria-hidden fill="currentColor">
      <path d="M100 18C108 8 122 6 134 12C146 18 158 24 170 20C180 17 186 10 184 2C194 12 192 28 178 36C160 46 134 46 118 38C110 34 104 32 100 34C96 32 90 34 82 38C66 46 40 46 22 36C8 28 6 12 16 2C14 10 20 17 30 20C42 24 54 18 66 12C78 6 92 8 100 18Z" />
    </svg>
  )
}

export function Fez({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <path d="M22 104L34 34C34 27 86 27 86 34L98 104C98 115 22 115 22 104Z" fill="#d9261c" />
      <path d="M70 29C80 30 86 32 86 34L98 104C98 110 89 113 76 114Z" fill="#a8130b" opacity=".7" />
      <path
        d="M40 40C41 64 38 86 33 100"
        stroke="#fff"
        strokeOpacity=".22"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="60" cy="33" rx="26" ry="6" fill="#b81d14" />
      <path
        d="M60 32C74 28 88 32 91 46"
        stroke="#1b1612"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="60" cy="32" r="3.5" fill="#1b1612" />
      <path
        d="M90 45C94 45 96 49 96 53L99 80C96 84 89 84 86 80L88 53C88 49 87 46 90 45Z"
        fill="#1b1612"
      />
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
        sizes="140px"
        className="h-8 w-auto"
        preload
      />
    )
  }
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-full bg-red text-white shadow-[var(--shadow-red)]">
        <Mustache className="h-2.5 w-auto" />
      </span>
      <span className="wordmark text-[1.45rem]">{name}</span>
    </span>
  )
}

export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2 text-red" aria-hidden>
      <span className="h-px w-12 bg-line" />
      <Mustache className="h-3 w-auto" />
      <span className="h-px w-12 bg-line" />
    </div>
  )
}

export function Loader() {
  return <Fez className="float h-14 w-auto" />
}

export function NotFoundArt() {
  return (
    <div className="relative mx-auto grid size-48 place-items-center rounded-full bg-accent-tint">
      <Fez className="float w-28 -rotate-12" />
    </div>
  )
}
