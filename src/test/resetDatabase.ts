import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { Migration, Payload } from 'payload'

import { migrations } from '@/migrations'

/**
 * Drops everything in the test database and re-applies the committed
 * migrations. (Payload's migrateFresh imports .ts files natively, which
 * doesn't work under Vitest, so the migrations are passed in.)
 */
export async function resetDatabase(payload: Payload) {
  const db = payload.db as unknown as PostgresAdapter
  if (!/_test\b/.test(process.env.DATABASE_URL ?? '')) {
    throw new Error('resetDatabase refuses to run outside a *_test database')
  }
  await db.drizzle.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)
  await db.migrate({ migrations: migrations as unknown as Migration[] })
}
