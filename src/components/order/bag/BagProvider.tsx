'use client'

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
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
}

type Contact = { phone: string | null; phoneHref: string | null }

const BagContext = createContext<Bag | null>(null)

/** The pickup bag, kept in this browser so it survives a reload or a closed tab. */
export function BagProvider({ children, contact }: { children: ReactNode; contact: Contact }) {
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

  const value: Bag = {
    lines: state.lines,
    count: bagCount(state.lines),
    subtotalCents: bagSubtotal(state.lines),
    ready: state.ready,
    dispatch: dispatch as Dispatch<BagAction>,
    contact,
  }
  return <BagContext value={value}>{children}</BagContext>
}

export function useBag(): Bag {
  const bag = useContext(BagContext)
  if (!bag) throw new Error('useBag needs a BagProvider')
  return bag
}
