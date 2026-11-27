/**
 * Where a checkout attempt's steps are recorded. Each step is written once:
 * whoever claims `order` creates the Clover order, whoever claims
 * `pay-started` charges the card. A process that loses a claim, or loses a
 * provider response, reconciles by reading; it never repeats the POST.
 *
 * Attempt IDs are scoped by the caller (`preview:<uuid>`, `<merchant>:<uuid>`)
 * so a preview attempt can never be read back as a real one.
 */

export type WebOrderStatus = 'pending' | 'paid' | 'declined' | 'review' | 'stopped'
export type PrintStatus = 'requested' | 'unconfirmed' | 'not-requested'

/** What the admin's Web orders list shows for one attempt. */
export type WebOrderSummary = {
  status: WebOrderStatus
  printStatus: PrintStatus
  cloverOrderId?: string
  totalCents?: number
  pickupName?: string
  phone?: string
  email?: string | null
  lines?: { name: string; quantity: number }[]
  readyAt?: string
  ipHash?: string
}

export interface CheckoutStore {
  /** Write once. False when this step already exists for the attempt (someone else won). */
  claim(attemptId: string, step: string, value: unknown): Promise<boolean>
  read<T>(attemptId: string, step: string): Promise<T | null>
  /** Upsert the admin-facing summary. Best effort: never throws into checkout. */
  summarize(attemptId: string, summary: WebOrderSummary): Promise<void>
}

/** In-process store for tests. */
export function memoryStore() {
  const steps = new Map<string, string>()
  const summaries = new Map<string, WebOrderSummary>()
  const store: CheckoutStore & {
    steps: Map<string, string>
    summaries: Map<string, WebOrderSummary>
  } = {
    steps,
    summaries,
    async claim(attemptId, step, value) {
      const key = attemptId + ':' + step
      if (steps.has(key)) return false
      steps.set(key, JSON.stringify(value))
      return true
    },
    async read<T>(attemptId: string, step: string) {
      const raw = steps.get(attemptId + ':' + step)
      return raw === undefined ? null : (JSON.parse(raw) as T)
    },
    async summarize(attemptId, summary) {
      summaries.set(attemptId, { ...summaries.get(attemptId), ...summary })
    },
  }
  return store
}
