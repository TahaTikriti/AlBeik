import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
})
