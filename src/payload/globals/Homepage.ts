import type { GlobalConfig } from 'payload'

import { previewUrl } from '@/lib/preview'

import { authenticated, publishedOrAuthenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { emphasisTextField } from '../fields/emphasisText'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Home page',
  admin: {
    livePreview: { url: () => previewUrl('/') },
    preview: () => previewUrl('/'),
  },
  access: { read: publishedOrAuthenticated, update: authenticated },
  versions: {
    drafts: { autosave: { interval: 400 } },
    max: 25,
  },
  hooks: {
    afterChange: [revalidateSite.globalAfterChange],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        emphasisTextField({ name: 'headline', required: true }),
        { name: 'subline', type: 'textarea' },
        { name: 'media', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'promise',
      label: 'Brand promise',
      type: 'group',
      fields: [
        emphasisTextField({ name: 'headline' }),
        { name: 'body', type: 'textarea' },
        { name: 'media', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'featuredItems',
      type: 'relationship',
      relationTo: 'menu-items',
      hasMany: true,
      admin: { description: 'Shown on the home page in this order.' },
    },
  ],
}
