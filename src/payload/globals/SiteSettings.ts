import type { GlobalConfig } from 'payload'

import { DAYS, isValidTime } from '@/lib/hours'

import { anyone, authenticated } from '../access'
import { validateHref } from '../fields/link'
import { orderUrlField } from '../fields/orderUrl'

const DAY_OPTIONS = DAYS.map((d) => ({ label: d[0]!.toUpperCase() + d.slice(1), value: d }))

const validateTime = (value: string | null | undefined) =>
  !value || isValidTime(value) || 'Use 24-hour time, e.g. 11:00 or 22:30.'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'AlBeik' },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
            },
            {
              name: 'showPrices',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Show menu prices on the site. Delivery-app prices can differ, so this is off by default.',
              },
            },
            {
              name: 'timezone',
              type: 'text',
              defaultValue: 'America/Chicago',
              admin: { description: 'IANA time zone for opening hours.' },
            },
          ],
        },
        {
          label: 'Ordering',
          fields: [
            orderUrlField({
              name: 'doordashStoreUrl',
              label: 'DoorDash store link',
              platform: 'doordash',
              description:
                'The restaurant page on DoorDash. Used when an item has no link of its own.',
            }),
            orderUrlField({
              name: 'uberEatsStoreUrl',
              label: 'Uber Eats store link',
              platform: 'ubereats',
              description:
                'The restaurant page on Uber Eats. Used when an item has no link of its own.',
            }),
          ],
        },
        {
          label: 'Locations',
          fields: [
            {
              name: 'locations',
              type: 'array',
              minRows: 1,
              labels: { singular: 'Location', plural: 'Locations' },
              admin: { initCollapsed: false },
              fields: [
                { name: 'name', type: 'text', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'streetAddress', type: 'text' },
                    { name: 'city', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'region', type: 'text', admin: { description: 'State, e.g. MO' } },
                    { name: 'postalCode', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'phone', type: 'text' },
                    {
                      name: 'mapUrl',
                      type: 'text',
                      validate: validateHref,
                      admin: { description: 'Google Maps link' },
                    },
                  ],
                },
                {
                  name: 'hours',
                  type: 'array',
                  labels: { singular: 'Opening hours', plural: 'Opening hours' },
                  fields: [
                    {
                      name: 'days',
                      type: 'select',
                      hasMany: true,
                      required: true,
                      options: DAY_OPTIONS,
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'opens', type: 'text', required: true, validate: validateTime },
                        { name: 'closes', type: 'text', required: true, validate: validateTime },
                      ],
                    },
                  ],
                },
                { name: 'hoursNote', type: 'text', admin: { description: 'e.g. Holiday hours' } },
              ],
            },
          ],
        },
        {
          label: 'Social & SEO',
          fields: [
            {
              name: 'socials',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'TikTok', value: 'tiktok' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'Google', value: 'google' },
                        { label: 'Yelp', value: 'yelp' },
                        { label: 'X', value: 'x' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'Other', value: 'other' },
                      ],
                    },
                    { name: 'url', type: 'text', required: true, validate: validateHref },
                  ],
                },
              ],
            },
            {
              name: 'seo',
              type: 'group',
              fields: [
                { name: 'defaultDescription', type: 'textarea' },
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { contains: 'image' } },
                  admin: {
                    description: 'Image used when the site is shared. 1200×630 works best.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
