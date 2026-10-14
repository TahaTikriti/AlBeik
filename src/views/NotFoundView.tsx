import Link from 'next/link'

import { ui } from '@/components/ui/classes'
import { copy } from '@/theme/copy'
import { NotFoundArt } from '@/theme/motifs'

export function NotFoundView() {
  return (
    <div className={`${ui.container} grid justify-items-center gap-5 py-section text-center`}>
      <NotFoundArt />
      <h1 className="text-display-1 max-w-[18ch]">{copy.notFound.title}</h1>
      <p className="max-w-[32ch] text-lg text-ink-muted">{copy.notFound.body}</p>
      <Link href="/menu" className="btn btn-red px-7">
        {copy.notFound.cta}
      </Link>
    </div>
  )
}
