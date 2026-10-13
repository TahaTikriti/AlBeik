import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { safeRedirectPath } from '@/lib/preview'

export async function GET(request: Request) {
  const path = safeRedirectPath(new URL(request.url).searchParams.get('path'))
  ;(await draftMode()).disable()
  redirect(path ?? '/')
}
