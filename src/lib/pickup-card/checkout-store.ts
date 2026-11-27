import { join } from 'node:path'

import { cmsEnabled, getPayloadClient } from '@/lib/data'

import { fileStore } from './payment-store'
import type { CheckoutStore } from './store'
import { payloadStore } from './store-payload'

/** Postgres when the CMS is on; a local folder for development without a database. */
export async function checkoutStore(): Promise<CheckoutStore> {
  if (cmsEnabled) return payloadStore(await getPayloadClient())
  return fileStore(process.env.PICKUP_STORE_DIR || join(process.cwd(), '.pickup-orders'))
}
