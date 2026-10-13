import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { validateHref } from '../fields/link'
import { sortOrderField } from '../fields/sortOrder'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'source', 'featured', 'sortOrder'],
  },
  defaultSort: 'sortOrder',
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
    { name: 'name', type: 'text', required: true },
    { name: 'quote', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'select',
          options: [
            { label: 'Google', value: 'google' },
            { label: 'Yelp', value: 'yelp' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Tripadvisor', value: 'tripadvisor' },
            { label: 'DoorDash', value: 'doordash' },
            { label: 'Uber Eats', value: 'uber-eats' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'sourceUrl', type: 'text', validate: validateHref },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on the home page.' },
    },
    sortOrderField,
  ],
}
