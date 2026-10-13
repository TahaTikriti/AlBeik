import Link from 'next/link'

import { ui } from '@/components/ui/classes'
import { copy } from '@/theme/copy'
import { NotFoundArt } from '@/theme/motifs'

export function NotFoundView() {
  return (
    <div className={`${ui.container} ${ui.section} grid justify-items-start gap-stack`}>
      <NotFoundArt />
      <h1 className="text-display-1">{copy.notFound.title}</h1>
      <p>{copy.notFound.body}</p>
      <Link href="/menu" className={ui.buttonPrimary}>
        {copy.notFound.cta}
      </Link>
    </div>
  )
}
