'use client'

import {
  createContext,
  type Dispatch,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import { BAG_STORAGE_KEY, type BagAction, type BagLine, bagCount, bagReducer, bagSubtotal, restoreBag } from './bag'

type Bag = {
  lines: BagLine[]
  count: number
  subtotalCents: number
  /** False until the saved bag has been read (avoids a flash of "empty"). */
  ready: boolean
  dispatch: Dispatch<BagAction>
  /** For "call us" when ordering online fails. */
  contact: Contact
  /** Online pickup is on: pickup is ordered on this site, not in an app. */
  online: boolean
  prepMinutes: number
  /** Opens the bag over the current page. */
  openBag: () => void
}

type Contact = { phone: string | null; phoneHref: string | null }

const BagContext = createContext<Bag | null>(null)

const importBagSheet = () => import('./BagSheet')
const BagSheet = lazy(importBagSheet)

/** The pickup bag, kept in this browser so it survives a reload or a closed tab. */
export function BagProvider({
  children,
  contact,
  online,
  prepMinutes,
}: {
  children: ReactNode
  contact: Contact
  online: boolean
  prepMinutes: number
}) {
  const [bagOpen, setBagOpen] = useState(false)
  const openBag = useCallback(() => setBagOpen(true), [])
  const [state, dispatch] = useReducer(
    (s: { lines: BagLine[]; ready: boolean }, action: BagAction | { type: 'restored'; lines: BagLine[] }) =>
      action.type === 'restored'
        ? { lines: action.lines, ready: true }
        : { ...s, lines: bagReducer(s.lines, action) },
    { lines: [], ready: false },
  )
  const loaded = useRef(false)

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(BAG_STORAGE_KEY)
    } catch {
      // Private mode or blocked storage: the bag lives for this page only.
    }
    loaded.current = true
    dispatch({ type: 'restored', lines: restoreBag(saved) })
    // Another tab changed the bag.
    const onStorage = (event: StorageEvent) => {
      if (event.key === BAG_STORAGE_KEY) dispatch({ type: 'restored', lines: restoreBag(event.newValue) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!loaded.current || !state.ready) return
    try {
      if (state.lines.length) localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(state.lines))
      else localStorage.removeItem(BAG_STORAGE_KEY)
    } catch {
      // See above.
    }
  }, [state])

  // The bag's code loads in the background once something is in it.
  const hasLines = state.lines.length > 0
  useEffect(() => {
    if (hasLines) void importBagSheet()
  }, [hasLines])

  const value: Bag = {
    lines: state.lines,
    count: bagCount(state.lines),
    subtotalCents: bagSubtotal(state.lines),
    ready: state.ready,
    dispatch: dispatch as Dispatch<BagAction>,
    contact,
    online,
    prepMinutes,
    openBag,
  }
  return (
    <BagContext value={value}>
      {children}
      {bagOpen ? (
        <Suspense fallback={null}>
          <BagSheet onClose={() => setBagOpen(false)} />
        </Suspense>
      ) : null}
    </BagContext>
  )
}

/** The bag, or null outside the site shell. */
export function useOptionalBag(): Bag | null {
  return useContext(BagContext)
}

/** True when pickup is ordered on this site (false outside the site shell). */
export function usePickupOnline(): boolean {
  return useContext(BagContext)?.online ?? false
}

export function useBag(): Bag {
  const bag = useContext(BagContext)
  if (!bag) throw new Error('useBag needs a BagProvider')
  return bag
}
