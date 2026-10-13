import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { safeRedirectPath } from '@/lib/preview'

/**
 * Entry point for the admin's live preview and preview button: checks the
 * shared secret and a logged-in Payload user, turns on draft mode, and
 * redirects to the page. Draft mode bypasses the static cache for this
 * browser only.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = safeRedirectPath(searchParams.get('path'))
  const secret = process.env.PREVIEW_SECRET

  if (!secret || searchParams.get('previewSecret') !== secret) {
    return new Response('Invalid preview link.', { status: 403 })
  }
  if (!path) {
    return new Response('Invalid preview path.', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const draft = await draftMode()
  if (!user) {
    draft.disable()
    return new Response('Log in to the admin to preview drafts.', { status: 403 })
  }

  draft.enable()
  redirect(path)
}
