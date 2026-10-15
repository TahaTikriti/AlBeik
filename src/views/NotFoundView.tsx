import Link from 'next/link'

import { ui } from '@/components/ui/classes'
import { copy } from '@/theme/copy'
import { FezMoment } from '@/theme/motifs'

export function NotFoundView() {
  return (
    <div className="grain relative overflow-hidden">
      <div className={`${ui.container} grid justify-items-center gap-6 py-section text-center`}>
        <p className="font-display text-mega text-red-text" aria-hidden>
          404
        </p>
        <FezMoment className="w-28 md:w-36" />
        <h1 className="text-display-1">{copy.notFound.title}</h1>
        <p className="max-w-[28ch] text-xl text-ink-muted">{copy.notFound.body}</p>
        <Link href="/menu" className="btn btn-red min-h-14 px-8">
          {copy.notFound.cta}
        </Link>
      </div>
    </div>
  )
}
