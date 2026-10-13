import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'

/** Shown only in draft mode, so editors know they're seeing unpublished changes. */
export function PreviewBanner() {
  return (
    <div role="status" className="bg-surface-inverse text-ink-inverse">
      <p className={`${ui.container} flex min-h-tap flex-wrap items-center gap-x-3 text-small`}>
        <span>{copy.preview.notice}</span>
        <a href="/next/exit-preview" className={ui.link}>
          {copy.preview.exit}
        </a>
      </p>
    </div>
  )
}
