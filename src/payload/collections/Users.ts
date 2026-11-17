import { APIError, type CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * The people who run the admin. Everyone is a full admin (no roles): any of
 * them can add, edit or remove the others. There is no email sending yet, so
 * whoever adds someone types a starting password and passes it on; that
 * person changes it under Account after signing in.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Admin', plural: 'Admins' },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
    description:
      'People who can sign in here and change the website. To add someone, press Create new, type their email and a starting password, and send them both; they can change the password under Account once signed in.',
    defaultColumns: ['name', 'email'],
  },
  auth: true,
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // Never lock everyone out: the last admin can't be deleted.
    beforeDelete: [
      async ({ req }) => {
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs <= 1) {
          // With `data` set, Payload shows the message as is; without it, a
          // production build (minified class names) shows "unknown error".
          throw new APIError(
            'This is the only admin, so it can’t be deleted. Add another first.',
            400,
            { reason: 'last-admin' },
            true,
          )
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', admin: { description: 'Shown in the admin, e.g. Sara.' } },
  ],
}
