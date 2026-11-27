import { CardError, type CardClient } from './types'

export type CloverEnv = 'sandbox' | 'production'

export type CardConfig =
  | { mode: 'preview' }
  | {
      mode: 'clover'
      env: CloverEnv
      merchantId: string
      publicKey: string
      privateKey: string
      restToken: string
      orderTypeId: string
    }

export type CloverConfig = Extract<CardConfig, { mode: 'clover' }>

const HOSTS: Record<CloverEnv, { platform: string; ecommerce: string; sdk: string }> = {
  sandbox: {
    platform: 'https://apisandbox.dev.clover.com/v3/merchants/',
    ecommerce: 'https://scl-sandbox.dev.clover.com/v1/orders/',
    sdk: 'https://checkout.sandbox.dev.clover.com/sdk.js',
  },
  production: {
    platform: 'https://api.clover.com/v3/merchants/',
    ecommerce: 'https://scl.clover.com/v1/orders/',
    sdk: 'https://checkout.clover.com/sdk.js',
  },
}

export function cloverUrls(env: CloverEnv) {
  return HOSTS[env]
}

/**
 * PICKUP_MODE turns online pickup on: `preview` simulates payments with a
 * fixture menu, `clover` connects to Clover (CLOVER_ENV picks sandbox or
 * production). Every key is server-side only except the public iframe key.
 */
export function getCardConfig(env: NodeJS.ProcessEnv = process.env): CardConfig {
  const mode = env.PICKUP_MODE?.trim()
  if (mode === 'preview') return { mode }
  if (mode !== 'clover') throw new CardError('Online pickup is switched off.', 404)
  const cloverEnv: CloverEnv = env.CLOVER_ENV?.trim() === 'production' ? 'production' : 'sandbox'
  const merchantId = env.CLOVER_MERCHANT_ID?.trim()
  const publicKey = env.CLOVER_PUBLIC_KEY?.trim()
  const privateKey = env.CLOVER_PRIVATE_KEY?.trim()
  const restToken = env.CLOVER_API_TOKEN?.trim()
  const orderTypeId = env.CLOVER_PICKUP_ORDER_TYPE_ID?.trim()
  if (!merchantId || !publicKey || !privateKey || !restToken || !orderTypeId) {
    throw new CardError('The Clover connection is incomplete.', 503)
  }
  return {
    mode,
    env: cloverEnv,
    merchantId,
    publicKey,
    privateKey,
    restToken,
    orderTypeId,
  }
}

export function cardClientConfig(config: CardConfig): CardClient {
  if (config.mode === 'preview') return config
  return {
    mode: config.mode,
    merchantId: config.merchantId,
    publicKey: config.publicKey,
    sdkUrl: cloverUrls(config.env).sdk,
  }
}
