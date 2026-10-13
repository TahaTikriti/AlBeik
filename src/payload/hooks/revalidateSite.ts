import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

/**
 * On-demand revalidation. Public pages are static; when public content
 * changes we invalidate the whole site (~25 pages, regenerated lazily on the
 * next visit). Simpler and safer than mapping each collection to paths.
 */

type ChangeArgs = {
  doc: unknown
  previousDoc?: unknown
  context?: Record<string, unknown>
}

const statusOf = (doc: unknown) =>
  doc && typeof doc === 'object' && '_status' in doc ? doc._status : undefined

/**
 * Publishing, unpublishing, or any change to a collection without drafts
 * affects the live site. Saves that only touch drafts don't.
 */
export function shouldRevalidate({ doc, previousDoc, context }: ChangeArgs): boolean {
  if (context?.disableRevalidate) return false
  const now = statusOf(doc)
  const before = statusOf(previousDoc)
  if (now === undefined && before === undefined) return true
  return now === 'published' || before === 'published'
}

function run(revalidate: () => void, req: PayloadRequest) {
  try {
    revalidate()
    req.payload.logger.info('Revalidated public pages')
  } catch (err) {
    // revalidatePath throws outside a Next.js request (e.g. `payload run`).
    // Never fail the save over it.
    req.payload.logger.warn({ err, msg: 'Skipped revalidation (not in a Next.js request)' })
  }
}

export function createRevalidateHooks(
  revalidate: () => void = () => revalidatePath('/', 'layout'),
) {
  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, context, req }) => {
    if (shouldRevalidate({ doc, previousDoc, context })) run(revalidate, req)
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, context, req }) => {
    if (!context?.disableRevalidate) run(revalidate, req)
    return doc
  }

  const globalAfterChange: GlobalAfterChangeHook = ({ doc, previousDoc, context, req }) => {
    if (shouldRevalidate({ doc, previousDoc, context })) run(revalidate, req)
    return doc
  }

  return { afterChange, afterDelete, globalAfterChange }
}

export const revalidateSite = createRevalidateHooks()
