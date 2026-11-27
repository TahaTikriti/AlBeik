// Immutable, atomically published milestones for this single-host sandbox spike.
import { randomUUID } from 'node:crypto'
import { link, mkdir, open, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { CardConfig } from './config'
import { CardError } from './types'

export function paymentDirectory(config: CardConfig, attemptId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    throw new CardError('Invalid checkout reference.', 400)
  }
  const scope =
    config.mode === 'preview' ? 'preview' : 'sandbox-' + encodeURIComponent(config.merchantId)
  return join(
    process.env.PICKUP_CARD_SPIKE_STORE || join(process.cwd(), '.pickup-card-spike'),
    scope,
    attemptId.toLowerCase(),
  )
}

export async function readMilestone<T>(dir: string, name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(join(dir, name + '.json'), 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

// Publish after flush. Only the winner of a hard-link claim may issue its side effect;
// a process that loses the provider response must reconcile, never repeat that POST.
export async function recordMilestone(dir: string, name: string, value: unknown): Promise<boolean> {
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
