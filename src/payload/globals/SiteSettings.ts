import type { GlobalConfig } from 'payload'

import { DAYS, isValidTime } from '@/lib/hours'
import { normalizeCloverPickupUrl } from '@/lib/order/clover'

import { anyone, authenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { emphasisTextField } from '../fields/emphasisText'
import { validateHref } from '../fields/link'
import { orderUrlField } from '../fields/orderUrl'

const DAY_OPTIONS = DAYS.map((d) => ({ label: d[0]!.toUpperCase() + d.slice(1), value: d }))

const dateTime = { date: { pickerAppearance: 'dayAndTime' as const } }

/** The banner must end after it starts. */
const validateEnd = (
  value: Date | string | null | undefined,
  { siblingData }: { siblingData: { startsAt?: Date | string | null } },
) =>
  !value ||
  !siblingData?.startsAt ||
  Date.parse(String(value)) > Date.parse(String(siblingData.startsAt)) ||
  'The banner has to end after it starts.'

const validateTime = (value: string | null | undefined) =>
  !value || isValidTime(value) || 'Use 24-hour time, e.g. 11:00 or 22:30.'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Website',
    description: 'Prices on or off, offer banner, order links, address and opening hours.',
  },
  access: { read: anyone, update: authenticated },
  hooks: {
    afterChange: [revalidateSite.globalAfterChange],
  },
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
            {
              name: 'onlinePickup',
              label: 'Online pickup on the website',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Customers add dishes to a bag and pay on the website; the order goes straight to Clover. Untick to pause it (pickup buttons go back to the apps).',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'prepMinutes',
                  label: 'Prep time (minutes)',
                  type: 'number',
                  defaultValue: 20,
                  min: 5,
                  max: 90,
                  admin: {
                    description:
                      'Shown as the ready time. Online orders stop this many minutes before closing.',
                  },
                },
                {
                  name: 'orderAlertEmail',
                  label: 'Email new orders to',
                  type: 'email',
                  admin: {
                    description: 'Optional. Sends an email for every paid web order.',
                  },
                },
              ],
            },
            {
              name: 'cloverPickupUrl',
              label: 'Clover pickup link',
              type: 'text',
              admin: {
                description:
                  'Paste the public ordering link from Clover Online Ordering. Leave blank to use the other pickup options.',
              },
              validate: (value: string | null | undefined) =>
                !value?.trim() ||
                Boolean(normalizeCloverPickupUrl(value)) ||
                'Paste the public HTTPS ordering link from Clover Online Ordering.',
            },
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
          label: 'Offer banner',
          description:
            'A strip above the header on every page, for special offers and occasions (Ramadan, Eid, holidays, a weekend deal).',
          fields: [
            {
              name: 'banner',
              label: false,
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  label: 'Show the banner',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  type: 'collapsible',
                  label: 'Banner content',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                  fields: [
                    emphasisTextField({ name: 'text', label: 'Message' }),
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'linkLabel',
                          type: 'text',
                          admin: { description: 'e.g. See the menu' },
                        },
                        {
                          name: 'linkUrl',
                          type: 'text',
                          validate: validateHref,
                          admin: { description: 'e.g. /menu or /catering' },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'startsAt',
                          label: 'Starts',
                          type: 'date',
                          admin: {
                            ...dateTime,
                            description: 'Optional. Leave empty to show it as soon as it is saved.',
                          },
                        },
                        {
                          name: 'endsAt',
                          label: 'Ends',
                          type: 'date',
                          validate: validateEnd,
                          admin: {
                            ...dateTime,
                            description: 'Optional. It hides itself at this moment.',
                          },
                        },
                      ],
                    },
                    {
                      name: 'countdownTo',
                      label: 'Count down to',
                      type: 'date',
                      admin: {
                        ...dateTime,
                        description: 'Optional. Shows a flip-clock countdown to this moment.',
                      },
                    },
                  ],
                },
              ],
            },
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
