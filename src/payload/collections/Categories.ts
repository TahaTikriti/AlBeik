import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { slugField } from '../fields/slug'
import { sortOrderField } from '../fields/sortOrder'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sortOrder'],
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
    slugField('name'),
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One line introducing the category on the menu.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'Optional icon or photo for the category.' },
    },
    sortOrderField,
    {
      name: 'items',
      type: 'join',
      collection: 'menu-items',
      on: 'category',
      admin: { defaultColumns: ['name', 'available', 'sortOrder'] },
    },
  ],
}
