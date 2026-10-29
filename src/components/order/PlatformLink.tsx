import type { ComponentProps } from 'react'

import type { ModeLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

/** What a link row says under the app's name, if anything. */
export function linkNotes(link: ModeLink, item: { slug: string; name: string } | null): string[] {
  return [
    item && link.level === 'store' ? copy.order.storeLevelNote : null,
    link.preset ? null : copy.order.pickupInApp(link.label),
  ].filter((note): note is string => !!note)
}

type Props = { link: ModeLink; notes: string[] } & Omit<ComponentProps<'a'>, 'href' | 'children'>

/** One app in the order choice (sheet or /order page): name, notes, arrow. */
export function PlatformLink({ link, notes, ...rest }: Props) {
  return (
    <a
      href={link.href}
      aria-label={[copy.order.on(link.label), ...notes].join(', ')}
      className="group flex min-h-[4.25rem] items-center justify-between rounded-control bg-white px-5 text-black transition-transform duration-(--duration-fast) active:scale-[0.98]"
      {...rest}
    >
      <span className="grid">
        <span className="font-display text-[1.6rem] leading-none uppercase">{link.label}</span>
        {notes.length ? (
          <span className="text-[0.8rem] text-charcoal/70">{notes.join(' · ')}</span>
        ) : null}
      </span>
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-full bg-red text-white transition-transform duration-(--duration-base) group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  )
}
