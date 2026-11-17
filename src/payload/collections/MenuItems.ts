import type { CollectionConfig } from 'payload'

import { previewUrl } from '@/lib/preview'

import { authenticated, publishedOrAuthenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { orderUrlField } from '../fields/orderUrl'
import { slugField } from '../fields/slug'
import { sortOrderField } from '../fields/sortOrder'

export const MENU_TAGS = [
  { label: 'Spicy', value: 'spicy' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Popular', value: 'popular' },
  { label: 'New', value: 'new' },
  { label: 'Signature', value: 'signature' },
] as const

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Dish', plural: 'Dishes' },
  admin: {
    useAsTitle: 'name',
    group: 'Menu',
    description: 'Every dish on the site. Open one to change its price, description or photo.',
    // Prices next to the name: on a phone only the first columns fit.
    defaultColumns: ['name', 'price', 'comboPrice', 'dealPrice', 'available', 'category'],
    pagination: { defaultLimit: 100 },
    listSearchableFields: ['name', 'shortDescription'],
    livePreview: { url: ({ data }) => previewUrl(`/menu/${data?.slug ?? ''}`) },
    preview: (data) => previewUrl(`/menu/${data?.slug ?? ''}`),
  },
  // By menu section, then position in it. Sections sort by when they were
  // created (the seed creates them in menu order), not by their own position.
  defaultSort: ['category', 'sortOrder'],
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    // Autosave drives live preview as the editor types.
    drafts: { autosave: { interval: 400 } },
    maxPerDoc: 25,
  },
  hooks: {
    afterChange: [revalidateSite.afterChange],
    afterDelete: [revalidateSite.afterDelete],
  },
  fields: [
    { name: 'name', label: 'Dish name', type: 'text', required: true },
    slugField('name'),
    { name: 'shortDescription', label: 'Description', type: 'textarea' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar', description: 'The menu section this dish appears in.' },
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
            description: 'In dollars, e.g. 11.65. For sandwiches, the sandwich alone.',
            components: { Cell: '/payload/admin/cells#PriceCell' },
          },
        },
        {
          name: 'comboPrice',
          label: 'Combo price',
          type: 'number',
          min: 0,
          admin: {
            step: 0.01,
            description: 'Only for sandwiches sold as a combo (with fries and a drink).',
            components: { Cell: '/payload/admin/cells#PriceCell' },
          },
        },
      ],
    },
    {
      name: 'sizes',
      label: 'Other sizes',
      type: 'array',
      maxRows: 3,
      labels: { singular: 'Size', plural: 'Sizes' },
      admin: {
        description: 'Optional, e.g. "Half portion" 5.10 or "12 pieces" 21.41.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { placeholder: 'Half portion' } },
            { name: 'price', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
          ],
        },
      ],
    },
    {
      name: 'dealPrice',
      label: 'Deal price',
      type: 'number',
      min: 0,
      validate: (
        value: number | null | undefined,
        { siblingData }: { siblingData: { price?: number | null } },
      ) => {
        // A custom validate replaces Payload's own number check, so `min` is
        // enforced here too.
        if (value == null) return true
        if (value <= 0) return 'The deal price has to be more than $0.'
        if (typeof siblingData?.price === 'number' && value >= siblingData.price) {
          return 'The deal price has to be lower than the price.'
        }
        return true
      },
      admin: {
        step: 0.01,
        description:
          'To put this dish on offer: the site shows the deal price and crosses out the normal price. Empty it to end the offer.',
        components: { Cell: '/payload/admin/cells#PriceCell' },
      },
    },
    {
      name: 'image',
      label: 'Photo',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'Square photos look best. Without one, the dish shows as text.' },
    },
    {
      name: 'tags',
      label: 'Labels',
      type: 'select',
      hasMany: true,
      options: [...MENU_TAGS],
      admin: { description: 'Optional. Halal is said site-wide, no label needed.' },
    },
    {
      name: 'available',
      label: 'On the menu',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Untick to hide this dish from the site (sold out, seasonal). Nothing is lost.',
        components: { Cell: '/payload/admin/cells#AvailableCell' },
      },
    },
    {
      type: 'collapsible',
      label: 'Order links (optional)',
      admin: {
        initCollapsed: true,
        description:
          'Links straight to this dish in the apps. Without one, the order button opens the restaurant page set in Site settings.',
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
    sortOrderField,
  ],
}
