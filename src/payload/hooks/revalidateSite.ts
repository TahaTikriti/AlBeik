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
  /** The write only touched drafts (`?draft=true`: draft saves and autosave). */
  isDraftSave: boolean
}

const hasStatus = (doc: unknown) => !!doc && typeof doc === 'object' && '_status' in doc

/**
 * Publishing, unpublishing, or any change to a collection without drafts
 * affects the live site; draft and autosave writes don't. Decided from the
 * request rather than `previousDoc`, because once autosave has run the
 * previous version is a draft even when the live document is published.
 */
export function shouldRevalidate({ doc, previousDoc, context, isDraftSave }: ChangeArgs): boolean {
  if (context?.disableRevalidate) return false
  if (!hasStatus(doc) && !hasStatus(previousDoc)) return true
  return !isDraftSave
}

const isDraftSave = (req: PayloadRequest) => {
  const draft = req.query?.draft
  return draft === true || draft === 'true'
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
    if (shouldRevalidate({ doc, previousDoc, context, isDraftSave: isDraftSave(req) })) {
      run(revalidate, req)
    }
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, context, req }) => {
    if (!context?.disableRevalidate) run(revalidate, req)
    return doc
  }

  const globalAfterChange: GlobalAfterChangeHook = ({ doc, previousDoc, context, req }) => {
    if (shouldRevalidate({ doc, previousDoc, context, isDraftSave: isDraftSave(req) })) {
      run(revalidate, req)
    }
    return doc
  }

  return { afterChange, afterDelete, globalAfterChange }
}

export const revalidateSite = createRevalidateHooks()
