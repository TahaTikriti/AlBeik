import type { Metadata } from 'next'

import { copy } from '@/theme/copy'
import { NotFoundView } from '@/views/NotFoundView'

export const metadata: Metadata = { title: copy.notFound.title }

export default function NotFound() {
  return <NotFoundView />
}
