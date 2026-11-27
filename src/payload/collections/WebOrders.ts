import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Pickup orders placed on the website, one per checkout attempt. Written by
 * the checkout only; the owner reads them here and acts in Clover.
 */
export const WebOrders: CollectionConfig = {
  slug: 'web-orders',
  labels: { singular: 'Web order', plural: 'Web orders' },
  admin: {
    group: 'Orders',
    useAsTitle: 'pickupName',
    description:
      'Pickup orders placed on the website. Refunds and changes are made in Clover; this list is for keeping an eye on them.',
    defaultColumns: ['createdAt', 'pickupName', 'totalCents', 'status', 'printStatus'],
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  endpoints: [
    {
      // The live screen calls this each poll: orders the customer stopped watching still settle.
      path: '/reconcile',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { reconcileWebOrders } = await import('@/lib/pickup-card/reconcile-web-orders')
        return Response.json({ checked: await reconcileWebOrders(req.payload) })
      },
    },
  ],
  access: {
    read: authenticated,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'attemptId', type: 'text', required: true, unique: true, index: true, admin: { hidden: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Waiting for payment', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Card declined', value: 'declined' },
        { label: 'Check in Clover', value: 'review' },
        { label: 'Stopped, not charged', value: 'stopped' },
      ],
    },
    {
      name: 'printStatus',
      label: 'Kitchen ticket',
      type: 'select',
      required: true,
      defaultValue: 'not-requested',
      options: [
        { label: 'Printing', value: 'requested' },
        { label: 'Not confirmed: print from Clover Orders', value: 'unconfirmed' },
        { label: 'Not sent', value: 'not-requested' },
      ],
    },
    { name: 'pickupName', label: 'Name', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    {
      name: 'totalCents',
      label: 'Total',
      type: 'number',
      admin: { components: { Cell: '/payload/admin/cells#CentsCell' } },
    },
    { name: 'lines', label: 'Items', type: 'json' },
    { name: 'readyAt', label: 'Ready around', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'cloverOrderId', label: 'Clover order', type: 'text' },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
  ],
}
