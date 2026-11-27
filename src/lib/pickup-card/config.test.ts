import { describe, expect, it } from 'vitest'

import { cloverUrls, getCardConfig } from './config'
import { CardError } from './types'

const full = {
  PICKUP_MODE: 'clover',
  CLOVER_MERCHANT_ID: 'MERCHANT00001',
  CLOVER_PUBLIC_KEY: 'pub',
  CLOVER_PRIVATE_KEY: 'priv',
  CLOVER_API_TOKEN: 'token',
  CLOVER_PICKUP_ORDER_TYPE_ID: 'ORDERTYPE0001',
} as unknown as NodeJS.ProcessEnv

function statusOf(env: NodeJS.ProcessEnv) {
  try {
    getCardConfig(env)
  } catch (error) {
    return error instanceof CardError ? error.status : 'other'
  }
  return 'ok'
}

describe('getCardConfig', () => {
  it('is off (404) when PICKUP_MODE is unset', () => {
    expect(statusOf({} as unknown as NodeJS.ProcessEnv)).toBe(404)
  })

  it('runs the preview without Clover values', () => {
    expect(getCardConfig({ PICKUP_MODE: 'preview' } as unknown as NodeJS.ProcessEnv)).toEqual({
      mode: 'preview',
    })
  })

  it('connects to production when CLOVER_ENV says so', () => {
    const config = getCardConfig({ ...full, CLOVER_ENV: 'production' })
    expect(config).toMatchObject({ mode: 'clover', env: 'production', merchantId: 'MERCHANT00001' })
  })

  it('defaults to the sandbox', () => {
    expect(getCardConfig(full)).toMatchObject({ mode: 'clover', env: 'sandbox' })
  })

  it('reports an incomplete connection as 503', () => {
    expect(statusOf({ ...full, CLOVER_PRIVATE_KEY: '' })).toBe(503)
  })
})

describe('cloverUrls', () => {
  it('points the sandbox at Clover sandbox hosts', () => {
    expect(cloverUrls('sandbox')).toEqual({
      platform: 'https://apisandbox.dev.clover.com/v3/merchants/',
      ecommerce: 'https://scl-sandbox.dev.clover.com/v1/orders/',
      sdk: 'https://checkout.sandbox.dev.clover.com/sdk.js',
    })
  })

  it('points production at Clover production hosts', () => {
    expect(cloverUrls('production')).toEqual({
      platform: 'https://api.clover.com/v3/merchants/',
      ecommerce: 'https://scl.clover.com/v1/orders/',
      sdk: 'https://checkout.clover.com/sdk.js',
    })
  })
})
