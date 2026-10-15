import Image from 'next/image'
import type { CSSProperties } from 'react'

import horizontal from './brand/albeik-logo-horizontal-original.png'
import mark from './brand/albeik-mark-original.png'
import wordmark from './brand/albeik-wordmark.png'

/**
 * poc/street brand motifs: AlBeik's logo, the mustache traced from it,
 * flip-clock numerals, smoke and steam.
 *
 * The logo is always the client's original (red fez, charcoal ink) on white,
 * as in docs/brand/brand-guidelines.png: never reversed. The files in ./brand
 * are cut, uncoloured, from public/brand/albeik-logo-stacked.png; the
 * horizontal one is rebuilt from those pieces to the proportions of
 * public/brand/albeik-logo-horizontal.jpg. Swap in vector files when the
 * client sends them.
 */

type SvgProps = { className?: string }

/** The mustache from the AlBeik logo. Inherits the text color. */
export function Mustache({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 767 143" className={className} aria-hidden fill="currentColor">
      <path d="M0.5 52.7L2.5 51L18.5 65.6L27.5 72.6L39.5 79.9L50.5 84.7L60.5 87.8L72.5 90L93.5 90L100.5 88.9L120.5 83.6L146.5 71.9L175.5 55.6L231.5 21L253.5 10L270.5 4L291.5 0L305.5 0L319.5 2L332.5 6L344.5 12L350.5 16L363.5 28.9L369.5 38.9L372.5 49.7L372.5 61.3L371.5 66.2L368.5 74.1L363.5 82.1L349.5 95L340.5 101L326.5 108L308.5 115L289.5 121L239.5 134L197.5 141L168.5 142.3L166.5 143L138.5 142L105.5 137L79.5 129L58.5 119L38.5 105L20.5 87L9.5 72.1L0.5 55.1ZM394.5 46.7L398.5 35.9L404.5 27L411.5 20L422.5 12L434.5 6L451.5 1L458.5 0L478.5 0L490.5 2L506.5 7L538.5 24L615.5 70.9L640.5 81.8L660.5 87L676.5 89L692.5 89L711.5 85.6L726.5 79.9L737.5 73.7L749.5 64.6L762.5 53L765.5 54.9L765.5 57.4L755.5 74.1L742.5 91L725.5 107L706.5 120L685.5 130L663.5 137L641.5 141L618.5 143L578.5 142L535.5 136L493.5 126L449.5 112L427.5 102L411.5 91L404.5 84L399.5 77L394.5 63.4Z" />
    </svg>
  )
}

/** The logo's fez-and-face mark, original colours: on white only. Decorative: pair it with text or a label. */
export function Mark({
  className,
  sizes,
  eager = false,
}: {
  className?: string
  /** How wide it renders, e.g. "2rem". */
  sizes: string
  eager?: boolean
}) {
  return (
    <Image
      src={mark}
      alt=""
      sizes={sizes}
      loading={eager ? 'eager' : undefined}
      className={className}
    />
  )
}

/** The ALBEIK wordmark. Takes the text color (charcoal next to the logo); size it by width or height. */
export function Wordmark({ className = '' }: SvgProps) {
  const url = `url(${wordmark.src})`
  return (
    <span
      aria-hidden
      className={`wordmark ${className}`}
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  )
}

/**
 * Header lockup: mark + wordmark, after the client's horizontal logo. The
 * wordmark is set larger than in that file (and "Lebanese Restaurant"
 * dropped) so it stays legible at header size. Sits on the white header.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* The Beik nods when you point at him: the one bit of character in the chrome. */}
      <Mark
        sizes="1.75rem"
        eager
        className="h-11 w-auto origin-[50%_85%] transition-transform duration-(--duration-base) ease-snap group-hover:-rotate-8 group-focus-visible:-rotate-8"
      />
      {/* Below 360px (small phones) the mark alone keeps the nav from overflowing. */}
      <Wordmark className="h-[1.05rem] w-[5.65rem] max-[359px]:hidden" />
    </span>
  )
}

/**
 * The full horizontal logo (mark, wordmark, "Lebanese Restaurant") on its
 * white panel, like the logo panel in the brand guidelines, with the card
 * radius. Size it by width.
 */
export function LogoPanel({ className = '', sizes }: { className?: string; sizes: string }) {
  return (
    <div data-theme="light" className={`rounded-card p-[7%] ${className}`}>
      <Image src={horizontal} alt="AlBeik Lebanese Restaurant" sizes={sizes} className="w-full" />
    </div>
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

/**
 * Embers drifting up off the grill, for the hero dish. Fixed values (no
 * randomness) so the server and browser agree; negative delays mean the fire
 * is already going on first paint.
 */
/** mulberry32: a well-spread, repeatable 0-1 value per seed. */
function hash(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const EMBERS = Array.from({ length: 28 }, (_, i) => {
  const r = (n: number) => hash(i * 16 + n)
  return {
    x: `${(4 + r(1) * 92).toFixed(1)}%`,
    size: `${(3 + r(2) * 5).toFixed(1)}px`,
    rise: Math.round(55 + r(3) * 45),
    drift: `${Math.round((r(4) - 0.5) * 90)}px`,
    duration: `${(3.2 + r(5) * 3.6).toFixed(2)}s`,
    delay: `${(-r(6) * 6).toFixed(2)}s`,
  }
})

export function Embers({ className = '' }: SvgProps) {
  return (
    <span className={`embers ${className}`} aria-hidden>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          style={
            {
              '--x': e.x,
              '--s': e.size,
              '--rise': e.rise,
              '--drift': e.drift,
              '--d': e.duration,
              '--delay': e.delay,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

/** The fez moment: the logo's mark on its white panel in a cloud of smoke, tipping its fez once on arrival. */
export function FezMoment({ className = '' }: SvgProps) {
  return (
    <div className={`relative ${className}`}>
      <Smoke className="opacity-80" />
      <div data-theme="light" className="relative rounded-card px-[18%] py-[14%] shadow-raised">
        <Mark sizes="(min-width: 768px) 6rem, 5rem" className="fez-tip w-full -rotate-6" />
      </div>
    </div>
  )
}
