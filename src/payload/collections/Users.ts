import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/** CMS editors. Every user is an admin for now; no roles. */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
  },
  auth: true,
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [{ name: 'name', type: 'text' }],
}
