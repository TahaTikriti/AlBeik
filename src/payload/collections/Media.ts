import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { anyone, authenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateSite.afterChange],
    afterDelete: [revalidateSite.afterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the photo for people who can’t see it.' },
    },
  ],
  upload: {
    // Local disk on main; production needs a storage adapter (see README).
    staticDir: process.env.PAYLOAD_MEDIA_DIR || path.resolve(dirname, '../../../media'),
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
    focalPoint: true,
  },
}
