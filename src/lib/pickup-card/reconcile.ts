type Row = { attemptId: string; status: string; createdAt: string }

/**
 * Orders still waiting on Clover after the customer's own checks would have
 * settled them (they closed the tab, lost signal): oldest first, a few per pass.
 */
export function staleAttempts(rows: Row[], now: Date, olderThanMs = 30_000, max = 5): string[] {
  return rows
    .filter((row) => row.status === 'pending' && now.getTime() - Date.parse(row.createdAt) >= olderThanMs)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, max)
    .map((row) => row.attemptId)
}
