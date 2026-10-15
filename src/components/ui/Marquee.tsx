import { Mustache } from '@/theme/motifs'

import { MarqueeTrack } from './MarqueeTrack'

/**
 * A red strip of slogans that scrolls sideways, pushed along by the page's
 * scroll and tilted until it scrolls into place (static with reduced motion).
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const run = (hidden: boolean) => (
    <span className="flex items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-5 font-display text-[1.35rem] tracking-[0.04em] uppercase">
            {item}
          </span>
          <Mustache className="h-3 w-auto opacity-90" />
        </span>
      ))}
    </span>
  )
  return (
    // Clips sideways only: the tilted strip is wider than the page, and any
    // overflow would make phones zoom out. Its ends may still overhang above
    // and below.
    <div className="relative z-1 overflow-x-clip">
      <div className="marquee marquee-tilt border-y-2 border-black bg-red py-2 text-white">
        <MarqueeTrack>
          {run(false)}
          {run(true)}
        </MarqueeTrack>
      </div>
    </div>
  )
}
