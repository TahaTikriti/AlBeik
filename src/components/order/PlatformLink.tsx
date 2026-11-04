import type { ComponentProps } from 'react'

import type { ModeLink } from '@/lib/data/types'
import { getPlatform } from '@/lib/order/platforms'
import { copy } from '@/theme/copy'

/** A line under the app's name. A hidden one still takes its room (see linkNotes). */
export type LinkNote = { text: string; shown: boolean }

/**
 * What a link row says under the app's name, one note per line. With
 * `steady` (the sheet, where the mode can change) an app that can't be
 * opened on pickup always keeps the room for its "choose Pickup" line, so the
 * row and the sheet keep their height when the mode changes.
 */
export function linkNotes(
  link: ModeLink,
  item: { slug: string; name: string } | null,
  { steady = false } = {},
): LinkNote[] {
  const notes: (LinkNote | null)[] = [
    item && link.level === 'store' ? { text: copy.order.storeLevelNote, shown: true } : null,
    link.preset ? null : { text: copy.order.pickupInApp(link.label), shown: true },
  ]
  if (steady && link.preset && !getPlatform(link.platform).modeParam) {
    notes.push({ text: copy.order.pickupInApp(link.label), shown: false })
  }
  return notes.filter((note): note is LinkNote => !!note)
}

type Props = { link: ModeLink; notes: LinkNote[] } & Omit<
  ComponentProps<'a'>,
  'href' | 'children'
>

/** One app in the order choice (sheet or /order page): name, notes, arrow. */
export function PlatformLink({ link, notes, ...rest }: Props) {
  const shown = notes.filter((note) => note.shown).map((note) => note.text)
  return (
    <a
      href={link.href}
      aria-label={[copy.order.on(link.label), ...shown].join(', ')}
      className="group flex min-h-[4.25rem] items-center justify-between gap-4 rounded-control bg-white px-5 py-3 text-black transition-transform duration-(--duration-fast) active:scale-[0.98]"
      {...rest}
    >
      <span className="grid min-w-0 gap-1">
        <span className="font-display text-[1.6rem] leading-none uppercase">{link.label}</span>
        {notes.map((note) => (
          <span
            key={note.text}
            aria-hidden={!note.shown || undefined}
            className={`text-[0.8rem] leading-tight text-charcoal/70 ${note.shown ? '' : 'invisible'}`}
          >
            {note.text}
          </span>
        ))}
      </span>
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-red text-white transition-transform duration-(--duration-base) group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  )
}
