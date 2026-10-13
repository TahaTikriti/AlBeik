import { ImageResponse } from 'next/og'

import { getSite } from '@/lib/data'
import { theme } from '@/theme/theme'

// Generated share image, used when the CMS has no Open Graph image.
export const dynamic = 'force-static'

export async function GET() {
  const site = await getSite()
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.og.background,
        color: theme.og.foreground,
        fontSize: 120,
        fontWeight: 800,
      }}
    >
      {site.name}
    </div>,
    { width: 1200, height: 630 },
  )
}
