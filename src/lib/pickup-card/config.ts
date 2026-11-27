import { CardError, type CardClient } from './types'

export type CardConfig =
  | { mode: 'preview' }
  | {
      mode: 'sandbox'
      merchantId: string
      publicKey: string
      privateKey: string
      restToken: string
      orderTypeId: string
      mapping: string
    }

export function getCardConfig(): CardConfig {
  const mode = process.env.PICKUP_CARD_SPIKE_MODE
  if (mode === 'preview') return { mode }
  if (mode !== 'sandbox') throw new CardError('Pickup checkout preview is disabled.', 404)
  const merchantId = process.env.CLOVER_SANDBOX_MERCHANT_ID?.trim()
  const publicKey = process.env.CLOVER_SANDBOX_IFRAME_PUBLIC_KEY?.trim()
  const privateKey = process.env.CLOVER_SANDBOX_ECOMMERCE_PRIVATE_KEY?.trim()
  const restToken = process.env.CLOVER_SANDBOX_REST_TOKEN?.trim()
  const orderTypeId = process.env.CLOVER_SANDBOX_PICKUP_ORDER_TYPE_ID?.trim()
  const mapping = process.env.CLOVER_SANDBOX_PICKUP_MAPPING?.trim()
  if (!merchantId || !publicKey || !privateKey || !restToken || !orderTypeId || !mapping) {
    throw new CardError('The Clover sandbox connection is incomplete.', 503)
  }
  return { mode, merchantId, publicKey, privateKey, restToken, orderTypeId, mapping }
}

export function cardClientConfig(config: CardConfig): CardClient {
  if (config.mode === 'preview') return config
  return { mode: config.mode, merchantId: config.merchantId, publicKey: config.publicKey }
}
