import type { CollectionConfig } from 'payload'

/**
 * The checkout's write-once journal (see src/lib/pickup-card/store.ts).
 * The unique `key` is what makes a step claimable exactly once across every
 * server instance. Hidden from the admin and closed to the API: only the
 * server writes it, through the Local API.
 */
export const CheckoutSteps: CollectionConfig = {
  slug: 'checkout-steps',
  admin: { hidden: true },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'attemptId', type: 'text', required: true, index: true },
    { name: 'step', type: 'text', required: true },
    { name: 'value', type: 'json' },
  ],
}
