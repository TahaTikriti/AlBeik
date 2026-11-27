'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { startOfDay } from '@/lib/hours'

type Line = { name: string; quantity: number }
type WebOrder = {
  id: number
  createdAt: string
  status: 'pending' | 'paid' | 'declined' | 'review' | 'stopped'
  printStatus?: 'requested' | 'unconfirmed' | 'not-requested'
  pickupName?: string | null
  phone?: string | null
  totalCents?: number | null
  lines?: Line[] | null
  readyAt?: string | null
  cloverOrderId?: string | null
}

const POLL_MS = 15_000
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const STATUS: Record<WebOrder['status'], string> = {
  paid: 'Paid',
  pending: 'Paying…',
  declined: 'Declined',
  review: 'Check in Clover',
  stopped: 'Not placed',
}

function phoneLabel(e164: string) {
  const d = e164.replace(/^\+1/, '')
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164
}

/** A short two-note chime, made in the browser (no sound file to load). */
function chime(context: AudioContext) {
  const start = context.currentTime
  for (const [i, frequency] of [880, 1318.5].entries()) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    const t = start + i * 0.18
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(t)
    oscillator.stop(t + 0.55)
  }
}

/**
 * Today's web orders, newest first, checked every 15 seconds. A new paid
 * order flashes and, once sound is on, chimes. Browsers only allow sound
 * after a click, hence the button.
 */
export function WebOrdersLive({ timeZone }: { timeZone: string }) {
  const [orders, setOrders] = useState<WebOrder[] | null>(null)
  const [error, setError] = useState(false)
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const [soundOn, setSoundOn] = useState(false)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const seen = useRef<Set<number> | null>(null)

  const load = useCallback(async () => {
    const since = startOfDay(timeZone).toISOString()
    const query = new URLSearchParams({
      'where[createdAt][greater_than_equal]': since,
      sort: '-createdAt',
      depth: '0',
      limit: '200',
    })
    try {
      // Settle any order still waiting on Clover first; a failure here only delays that.
      await fetch('/api/web-orders/reconcile', { method: 'POST', credentials: 'include' }).catch(() => null)
      const response = await fetch('/api/web-orders?' + query, { credentials: 'include', cache: 'no-store' })
      if (!response.ok) throw new Error(String(response.status))
      const { docs } = (await response.json()) as { docs: WebOrder[] }
      const paid = docs.filter((o) => o.status === 'paid').map((o) => o.id)
      if (seen.current) {
        const arrived = paid.filter((id) => !seen.current!.has(id))
        if (arrived.length) {
          setFresh((current) => new Set([...current, ...arrived]))
          if (audio.current?.state === 'running') chime(audio.current)
          setTimeout(
            () => setFresh((current) => new Set([...current].filter((id) => !arrived.includes(id)))),
            60_000,
          )
        }
      }
      seen.current = new Set([...(seen.current ?? []), ...paid])
      setOrders(docs)
      setError(false)
      setCheckedAt(new Date())
    } catch {
      setError(true)
    }
  }, [timeZone])

  useEffect(() => {
    const first = setTimeout(() => void load(), 0)
    const timer = setInterval(() => void load(), POLL_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [load])

  function toggleSound() {
    if (soundOn) {
      void audio.current?.suspend()
      setSoundOn(false)
      return
    }
    audio.current ??= new AudioContext()
    void audio.current.resume().then(() => chime(audio.current!))
    setSoundOn(true)
  }

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const total = paid.reduce((sum, o) => sum + (o.totalCents ?? 0), 0)

  return (
    <div className="ab-orders">
      <header className="ab-dash__head">
        <div>
          <h1 className="ab-dash__title">Web orders today</h1>
          <p className="ab-dash__lede">
            {paid.length} paid · {money.format(total / 100)}
            {checkedAt ? ` · checked ${checkedAt.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : ''}
          </p>
        </div>
        <button type="button" className={`ab-orders__sound${soundOn ? ' is-on' : ''}`} onClick={toggleSound} aria-pressed={soundOn}>
          {soundOn ? 'Sound on' : 'Turn sound on'}
        </button>
      </header>

      {error ? (
        <p className="ab-dash__alert" role="alert">
          Couldn’t check for orders. Trying again every 15 seconds; reload if it doesn’t clear.
        </p>
      ) : null}

      {orders === null ? (
        <p className="ab-dash__lede">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="ab-dash__lede">No web orders yet today.</p>
      ) : (
        <ul className="ab-orders__list">
          {orders.map((order) => (
            <li
              key={order.id}
              className={`ab-orders__row is-${order.status}${fresh.has(order.id) ? ' is-new' : ''}`}
            >
              <div className="ab-orders__when">
                <strong>{time(order.createdAt)}</strong>
                {order.readyAt && order.status === 'paid' ? <span>ready {time(order.readyAt)}</span> : null}
              </div>
              <div className="ab-orders__who">
                <strong>{order.pickupName || 'Guest'}</strong>
                {order.phone ? <a href={`tel:${order.phone}`}>{phoneLabel(order.phone)}</a> : null}
              </div>
              <ul className="ab-orders__items">
                {(order.lines ?? []).map((line, i) => (
                  <li key={i}>
                    {line.quantity} × {line.name}
                  </li>
                ))}
              </ul>
              <div className="ab-orders__money">
                <strong>{order.totalCents != null ? money.format(order.totalCents / 100) : '—'}</strong>
                <span className="ab-orders__status">{STATUS[order.status]}</span>
                {order.status === 'paid' ? (
                  <span className="ab-orders__kitchen">
                    {order.printStatus === 'requested' ? 'Printed' : 'Print it from Clover Orders'}
                  </span>
                ) : null}
              </div>
              {order.status === 'review' ? (
                <p className="ab-orders__note">Check this order in Clover before making it.</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
