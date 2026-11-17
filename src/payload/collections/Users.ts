import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/** CMS editors. Every user is an admin for now; no roles. */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
    description: 'People who can sign in here. Add one per person; each sets their own password.',
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
