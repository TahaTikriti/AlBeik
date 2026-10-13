import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { isSafeRedirectPath } from '@/lib/preview'

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')
  ;(await draftMode()).disable()
  redirect(isSafeRedirectPath(path) ? path : '/')
}
