import type { GlobalConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { emphasisTextField } from '../fields/emphasisText'
import { validateHref } from '../fields/link'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Home page',
  access: { read: publishedOrAuthenticated, update: authenticated },
  versions: {
    drafts: true,
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
    {
      name: 'promo',
      label: 'Promo banner',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        {
          type: 'collapsible',
          label: 'Banner content',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
          fields: [
            emphasisTextField({ name: 'text' }),
            {
              type: 'row',
              fields: [
                { name: 'linkLabel', type: 'text' },
                { name: 'linkUrl', type: 'text', validate: validateHref },
              ],
            },
            {
              name: 'countdownTo',
              type: 'date',
              admin: {
                date: { pickerAppearance: 'dayAndTime' },
                description: 'Optional. Shows a countdown to this moment.',
              },
            },
          ],
        },
      ],
    },
  ],
}
