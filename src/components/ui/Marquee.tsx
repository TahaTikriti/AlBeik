import { Mustache } from '@/theme/motifs'

/** A red strip of slogans that scrolls sideways (static with reduced motion). */
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
    <div className="marquee border-y-2 border-black bg-red py-2 text-white">
      <div className="marquee-track">
        {run(false)}
        {run(true)}
      </div>
    </div>
  )
}
