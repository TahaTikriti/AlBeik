import Link from 'next/link'

import type { BannerVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { Countdown } from '../ui/Countdown'
import { Emphasis } from '../ui/Emphasis'
import { ui } from '../ui/classes'

const toMs = (iso: string | null) => (iso ? String(Date.parse(iso)) : undefined)

/**
 * Pages are static and only rebuilt when content is published, so the browser
 * decides whether the banner is live. This runs as soon as the banner is
 * parsed, before the first paint: no flash, and the page doesn't jump.
 */
const SHOW_WHEN_LIVE = `(function(b){var n=Date.now(),s=b.getAttribute('data-starts'),e=b.getAttribute('data-ends');b.hidden=!!(s&&n<+s)||!!(e&&n>=+e)})(document.currentScript.previousElementSibling)`

/**
 * The site-wide offer / occasion strip above the header (Site settings →
 * Offer banner): a red field like the brand's posts, one word in black.
 */
export function OfferBanner({ banner }: { banner: BannerVM }) {
  return (
    <>
      <aside
        aria-label={copy.banner.label}
        data-theme="inverse"
        data-starts={toMs(banner.startsAt)}
        data-ends={toMs(banner.endsAt)}
        // The script below may change `hidden` before React hydrates.
        suppressHydrationWarning
        className="bg-surface text-ink"
      >
        <p
          className={`${ui.container} flex min-h-10 flex-wrap items-center justify-center gap-x-3 py-1.5 text-center font-display text-base leading-tight uppercase sm:min-h-11 sm:text-lg`}
        >
          {banner.countdownTo ? <Countdown to={banner.countdownTo} /> : null}
          <span>
            <Emphasis line={banner.text} />
            {/* Inline after the message, so phones keep it to two lines. */}
            {banner.linkUrl ? (
              <>
                {' '}
                <Link
                  href={banner.linkUrl}
                  className="label ms-1 whitespace-nowrap underline decoration-2 underline-offset-4 hover:decoration-black"
                >
                  {banner.linkLabel ?? copy.banner.more}
                </Link>
              </>
            ) : null}
          </span>
        </p>
      </aside>
      <script dangerouslySetInnerHTML={{ __html: SHOW_WHEN_LIVE }} />
    </>
  )
}
