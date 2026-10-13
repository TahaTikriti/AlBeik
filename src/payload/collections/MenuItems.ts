import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { orderUrlField } from '../fields/orderUrl'
import { slugField } from '../fields/slug'
import { sortOrderField } from '../fields/sortOrder'

export const MENU_TAGS = [
  { label: 'Spicy', value: 'spicy' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Popular', value: 'popular' },
  { label: 'New', value: 'new' },
  { label: 'Signature', value: 'signature' },
] as const

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Menu item', plural: 'Menu items' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'available', 'sortOrder', '_status'],
    listSearchableFields: ['name', 'shortDescription'],
  },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'shortDescription', type: 'textarea' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            description: 'USD. Only shown if "Show prices" is on in Site settings.',
          },
        },
        {
          name: 'tags',
          type: 'select',
          hasMany: true,
          options: [...MENU_TAGS],
          admin: { description: 'Halal is site-wide, no tag needed.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Order links',
      admin: {
        description:
          'Optional links straight to this dish. Without one, the order button falls back to the store page set in Site settings.',
      },
      fields: [
        orderUrlField({
          name: 'doordashUrl',
          label: 'DoorDash item link',
          platform: 'doordash',
          description: 'In the DoorDash app, open the dish and use Share.',
        }),
        orderUrlField({
          name: 'uberEatsUrl',
          label: 'Uber Eats item link',
          platform: 'ubereats',
          description: 'In the Uber Eats app, open the dish and use Share.',
        }),
      ],
    },
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Untick to hide this item from the site.',
      },
    },
    sortOrderField,
  ],
}
