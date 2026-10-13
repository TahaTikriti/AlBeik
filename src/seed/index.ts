/**
 * `pnpm seed`: fills the database with the scraped albeik.us content.
 * Safe to re-run (creates only what's missing). Runs via `payload run`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { TODO } from './content'
import { seed } from './seed'

const payload = await getPayload({ config })

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (!email || !password) {
  payload.logger.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin user created.')
}

await seed(payload, {
  admin: email && password ? { email, password } : undefined,
  log: (message) => payload.logger.info(message),
})

payload.logger.info(
  `Seeded. Still to collect from the client:\n${TODO.map((t) => `  - ${t}`).join('\n')}`,
)
process.exit(0)
