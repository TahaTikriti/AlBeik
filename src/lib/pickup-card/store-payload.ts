// Postgres-backed checkout store (through Payload), shared by every server instance.
import type { Payload } from 'payload'

import type { CheckoutStore, WebOrderSummary } from './store'

/** Postgres unique violation, however Payload / Drizzle wrap it. */
function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 5; depth++) {
    const err = e as { code?: string; name?: string; data?: { errors?: { message?: string }[] }; cause?: unknown }
    if (err.code === '23505') return true
    if (
      err.name === 'ValidationError' &&
      err.data?.errors?.some((item) => /unique|already/i.test(item.message ?? ''))
    )
      return true
    e = err.cause
  }
  return false
}

export function payloadStore(payload: Payload): CheckoutStore {
  return {
    async claim(attemptId, step, value) {
      try {
        await payload.create({
          collection: 'checkout-steps',
          overrideAccess: true,
          // Wrapped: Payload's JSON field would try to parse a bare string.
          data: { key: attemptId + ':' + step, attemptId, step, value: { v: value } as never },
        })
        return true
      } catch (error) {
        if (isUniqueViolation(error)) return false
        throw error
      }
    },
    async read<T>(attemptId: string, step: string) {
      const { docs } = await payload.find({
        collection: 'checkout-steps',
        overrideAccess: true,
        where: { key: { equals: attemptId + ':' + step } },
        limit: 1,
        depth: 0,
        pagination: false,
      })
      const stored = docs[0]?.value as { v?: T } | undefined
      return stored ? (stored.v ?? null) : null
    },
    async summarize(attemptId, summary: WebOrderSummary) {
      try {
        const data = { attemptId, ...summary, email: summary.email ?? undefined }
        const { docs } = await payload.update({
          collection: 'web-orders',
          overrideAccess: true,
          where: { attemptId: { equals: attemptId } },
          data,
          depth: 0,
        })
        if (docs.length) return
        await payload
          .create({ collection: 'web-orders', overrideAccess: true, data, depth: 0 })
          .catch(async (error: unknown) => {
            // Two summaries raced to create the row: update the winner's.
            if (!isUniqueViolation(error)) throw error
            await payload.update({
              collection: 'web-orders',
              overrideAccess: true,
              where: { attemptId: { equals: attemptId } },
              data,
              depth: 0,
            })
          })
      } catch (error) {
        console.error('[pickup] Web order summary failed', error)
      }
    },
    async countRecent(ipHash, since) {
      const { totalDocs } = await payload.count({
        collection: 'web-orders',
        overrideAccess: true,
        where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than_equal: since.toISOString() } }] },
      })
      return totalDocs
    },
  }
}
