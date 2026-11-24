import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './payload/collections/Categories'
import { Media } from './payload/collections/Media'
import { MenuItems } from './payload/collections/MenuItems'
import { Testimonials } from './payload/collections/Testimonials'
import { Users } from './payload/collections/Users'
import { About } from './payload/globals/About'
import { Homepage } from './payload/globals/Homepage'
import { SiteSettings } from './payload/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · AlBeik admin',
    },
    components: {
      graphics: {
        Logo: '/payload/admin/Logo#Logo',
        Icon: '/payload/admin/Icon#Icon',
      },
      // The admin's home page: what's live, quick actions, every section.
      views: { dashboard: { Component: '/payload/admin/Dashboard#Dashboard' } },
    },
    // Matches the sizes the site is checked at.
    livePreview: {
      breakpoints: [
        { label: 'Phone', name: 'phone', width: 375, height: 812 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1280, height: 800 },
      ],
    },
  },
  collections: [MenuItems, Categories, Testimonials, Media, Users],
  globals: [Homepage, About, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Migrations only, in every environment. Mixing dev-mode push with
    // migrations on one database makes Payload prompt interactively.
    push: false,
  }),
  sharp,
  plugins: [
    // Photos go to Vercel Blob when the site runs on Vercel with a Blob store
    // connected (it sets BLOB_READ_WRITE_TOKEN); without it they're saved to
    // the local media/ folder, which Vercel would lose on every deploy.
    // Uploads go straight from the browser, past Vercel's 4.5 MB request
    // limit, so full-size phone photos work.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Photos and the hero video are public, so links point straight at the
      // Blob CDN (cached at the edge) instead of streaming every request
      // through a server function.
      collections: { media: { disablePayloadAccessControl: true } },
      clientUploads: true,
      // Same database columns with or without Blob, so one set of migrations.
      alwaysInsertFields: true,
    }),
  ],
})
