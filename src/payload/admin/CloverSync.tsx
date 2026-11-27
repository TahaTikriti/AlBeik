'use client'

import { Button } from '@payloadcms/ui'
import { useState } from 'react'

import './dashboard.scss'

type Result = { linked: number; pricesUpdated: number; unmatched: string[] }

/**
 * Site settings → Ordering: links unlinked dishes to Clover items by name and
 * copies Clover's prices onto the site, so the menu shows what Clover charges.
 */
export function CloverSync() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/globals/site-settings/clover-sync', {
        method: 'POST',
        credentials: 'include',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Clover did not answer. Try again.')
      setResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clover did not answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="clover-sync">
      <p className="clover-sync__lead">
        Links each dish to its Clover item by name and copies Clover&rsquo;s prices to the website.
        Dishes it can&rsquo;t match are listed below: open the dish and paste its Clover item ID
        under &ldquo;Online ordering (Clover)&rdquo;.
      </p>
      <Button buttonStyle="secondary" onClick={run} disabled={busy}>
        {busy ? 'Talking to Clover…' : 'Link dishes to Clover and update prices'}
      </Button>
      {error ? <p className="clover-sync__error">{error}</p> : null}
      {result ? (
        <div className="clover-sync__result">
          <p>
            {result.linked} dish{result.linked === 1 ? '' : 'es'} linked ·{' '}
            {result.pricesUpdated} price{result.pricesUpdated === 1 ? '' : 's'} updated.
          </p>
          {result.unmatched.length ? (
            <>
              <p>Not found in Clover:</p>
              <ul>
                {result.unmatched.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>Every dish is linked.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
