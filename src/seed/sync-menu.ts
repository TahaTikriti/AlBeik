/**
 * `pnpm seed:menu`: brings the menu in the database in line with
 * src/seed/content.ts (the client's updated menu, 2026-11-03), seeding
 * anything missing first. Overwrites menu edits made in the admin; dishes no
 * longer on the menu are hidden, not deleted. Runs via `payload run`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seed } from './seed'

const payload = await getPayload({ config })

await seed(payload, { syncMenu: true, log: (message) => payload.logger.info(message) })

process.exit(0)
