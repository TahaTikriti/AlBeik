import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
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
  // withPayload sends `Critical-CH: Sec-CH-Prefers-Color-Scheme` (the admin's
  // color theme) on every route. On the public site that makes Chrome restart
  // the first navigation, costing ~600 ms on mobile. Keep it on the admin only.
  async headers() {
    const rules = (await payloadHeaders?.()) ?? []
    return rules.map((rule) =>
      rule.source === '/:path*' ? { ...rule, source: '/admin/:path*' } : rule,
    )
  },
} satisfies NextConfig
