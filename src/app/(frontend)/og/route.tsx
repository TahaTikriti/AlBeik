import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ImageResponse } from 'next/og'

import { getSite } from '@/lib/data'

// Generated share image, used when the CMS has no Open Graph image: a brand
// photo (docs/brand/photos/platter-2.png, cropped to 1200x630) with the
// original logo on its white panel. Rendered once at build time.
export const dynamic = 'force-static'

const dataUrl = async (path: string, type: string) =>
  `data:${type};base64,${(await readFile(join(process.cwd(), path))).toString('base64')}`

export async function GET() {
  const [site, photo, logo] = await Promise.all([
    getSite(),
    dataUrl('src/app/(frontend)/og/og-photo.jpg', 'image/jpeg'),
    dataUrl('src/theme/brand/albeik-logo-horizontal-original.png', 'image/png'),
  ])
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
      <img src={photo} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'absolute',
          left: 48,
          bottom: 48,
          display: 'flex',
          padding: 24,
          borderRadius: 16,
          background: '#ffffff',
          boxShadow: '0 18px 40px -12px rgba(0,0,0,0.65)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
        <img src={logo} alt={site.name} width={360} height={196} />
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
