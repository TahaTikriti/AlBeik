'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/** In draft mode, re-renders the page whenever the editor saves (autosave included). */
export function LivePreviewListener() {
  const router = useRouter()
  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      // The admin is served by this same app, so the page's own origin works
      // when NEXT_PUBLIC_SERVER_URL isn't set.
      serverURL={
        process.env.NEXT_PUBLIC_SERVER_URL ||
        (typeof window === 'undefined' ? '' : window.location.origin)
      }
    />
  )
}
