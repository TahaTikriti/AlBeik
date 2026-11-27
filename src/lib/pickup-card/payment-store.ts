// File-backed checkout store for local development without a database.
// Steps are immutable and published atomically: a hard link either claims the
// step name or fails because another process already did. One host only.
import { randomUUID } from 'node:crypto'
import { link, mkdir, open, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { CheckoutStore, WebOrderSummary } from './store'
import { CardError } from './types'

const SCOPED_ID = /^([A-Za-z0-9_-]{1,40}):([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/

// A rate-limit window (see limits.ts): limit:<kind>:<hashed address>:<window number>.
const LIMIT_ID = /^limit:([a-z]{1,20}):([0-9a-f]{1,64}):(\d{1,16})$/

function attemptDirectory(root: string, attemptId: string) {
  const match = SCOPED_ID.exec(attemptId)
  if (match) return join(root, match[1]!, match[2]!)
  const limit = LIMIT_ID.exec(attemptId)
  if (limit) return join(root, 'limits', limit[1]!, limit[2]! + '-' + limit[3]!)
  throw new CardError('Invalid checkout reference.', 400)
}

async function readStep<T>(dir: string, name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(join(dir, name + '.json'), 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

// Publish after flush. Only the winner of a hard-link claim may issue its side effect;
// a process that loses the provider response must reconcile, never repeat that POST.
async function claimStep(dir: string, name: string, value: unknown): Promise<boolean> {
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const temporary = join(dir, randomUUID() + '.tmp')
  const file = await open(temporary, 'wx', 0o600)
  try {
    try {
      await file.writeFile(JSON.stringify(value))
      await file.sync()
    } finally {
      await file.close()
    }
    try {
      await link(temporary, join(dir, name + '.json'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false
      throw error
    }
    const directory = await open(dir, 'r')
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
    return true
  } finally {
    await unlink(temporary)
  }
}

export function fileStore(root: string): CheckoutStore {
  return {
    claim: (attemptId, step, value) => claimStep(attemptDirectory(root, attemptId), step, value),
    read: (attemptId, step) => readStep(attemptDirectory(root, attemptId), step),
    async summarize(attemptId, summary: WebOrderSummary) {
      try {
        const dir = attemptDirectory(root, attemptId)
        const previous = (await readStep<WebOrderSummary & { createdAt?: string }>(dir, 'summary')) ?? {
          createdAt: new Date().toISOString(),
        }
        await mkdir(dir, { recursive: true, mode: 0o700 })
        await writeFile(join(dir, 'summary.json'), JSON.stringify({ ...previous, ...summary }))
      } catch {
        // The summary is for people; checkout never waits on it.
      }
    },
  }
}
