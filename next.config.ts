import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
    // AVIF first (about a fifth smaller than WebP): the hero photo is the home
    // page's largest paint.
    formats: ['image/avif', 'image/webp'],
    // Keep optimized photos for a week (default 4 h), in the browser and at the
    // edge, so reopening a dish never waits on the network. Local images are
    // read from disk, so the /seed Cache-Control below doesn't carry over.
    // No purge exists: replace a photo under a new file name.
    minimumCacheTTL: 604800,
    // Payload serves uploads from the same app and may append a cache-busting
    // query string; a pattern without `search` allows any query.
    // /seed/** holds the demo photos used when no database is configured.
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/seed/**' }],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(nextConfig, { devBundleServerPackages: false })
const payloadHeaders = config.headers

export default {
  ...config,
  // The blueprint's clean URLs, plus the old albeik.us paths, so earlier links
  // and search results land on the right page.
  async redirects() {
    return [
      { source: '/about', destination: '/our-story', permanent: true },
      { source: '/about-us', destination: '/our-story', permanent: true },
      { source: '/location', destination: '/visit', permanent: true },
      { source: '/contact-us', destination: '/visit', permanent: true },
      { source: '/our-menu', destination: '/menu', permanent: true },
    ]
  },
  // withPayload sends `Critical-CH: Sec-CH-Prefers-Color-Scheme` (the admin's
  // color theme) on every route. On the public site that makes Chrome restart
  // the first navigation, costing ~600 ms on mobile. Keep it on the admin only.
  async headers() {
    const rules = (await payloadHeaders?.()) ?? []
    return [
      ...rules.map((rule) =>
        rule.source === '/:path*' ? { ...rule, source: '/admin/:path*' } : rule,
      ),
      // Demo photos and the hero video: public/ files default to max-age=0, so
      // phones re-checked every photo on every view (and /_next/image inherits
      // the larger of this and minimumCacheTTL). A week fresh, a month served
      // stale while it refreshes. Replacing a file? Give it a new name.
      {
        source: '/seed/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' },
        ],
      },
    ]
  },
} satisfies NextConfig
