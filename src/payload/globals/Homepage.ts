import type { GlobalConfig } from 'payload'

import { previewUrl } from '@/lib/preview'

import { authenticated, publishedOrAuthenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { emphasisTextField } from '../fields/emphasisText'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Home page',
  admin: {
    group: 'Website',
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
        {
          name: 'media',
          label: 'Photo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Shown when there is no video.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'video',
              label: 'Video (optional)',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'video' } },
              admin: {
                description:
                  'A short silent loop (MP4, under 10 seconds and 3 MB). Plays instead of the photo.',
              },
            },
            {
              name: 'videoCover',
              label: 'Video cover',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
              admin: {
                description:
                  "A still of the video's first frame, shown while it loads and for visitors who save data.",
              },
            },
          ],
        },
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
