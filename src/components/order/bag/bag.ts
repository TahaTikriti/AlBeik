import { type CardLine, MAX_ITEM_QUANTITY } from '@/lib/pickup-card/types'

/** A bag line plus what the bag shows without asking the server. */
export type BagLine = CardLine & {
  slug: string
  /** The dish name on the site. */
  name: string
  /** The option: "Sandwich", "Combo". */
  label: string
  /** Item plus modifiers, from the last price Clover gave. */
  unitCents: number
  modifierNames: string[]
}

export type BagAction =
  | { type: 'add'; line: BagLine }
  | { type: 'quantity'; index: number; quantity: number }
  | { type: 'remove'; index: number }
  | { type: 'clear' }
  | { type: 'replace'; lines: BagLine[] }

export const BAG_STORAGE_KEY = 'albeik.bag.v1'
const MAX_LINES = 50

const clamp = (quantity: number) => Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity)))
const sameLine = (a: CardLine, b: CardLine) =>
  a.optionId === b.optionId &&
  a.modifierIds.length === b.modifierIds.length &&
  [...a.modifierIds].sort().join() === [...b.modifierIds].sort().join()

export function bagReducer(state: BagLine[], action: BagAction): BagLine[] {
  switch (action.type) {
    case 'add': {
      const index = state.findIndex((line) => sameLine(line, action.line))
      if (index === -1)
        return state.length >= MAX_LINES
          ? state
          : [...state, { ...action.line, quantity: Math.max(1, clamp(action.line.quantity)) }]
      return state.map((line, i) =>
        i === index ? { ...action.line, quantity: clamp(line.quantity + action.line.quantity) } : line,
      )
    }
    case 'quantity': {
      const quantity = clamp(action.quantity)
      return quantity === 0
        ? state.filter((_, i) => i !== action.index)
        : state.map((line, i) => (i === action.index ? { ...line, quantity } : line))
    }
    case 'remove':
      return state.filter((_, i) => i !== action.index)
    case 'clear':
      return []
    case 'replace':
      return action.lines
  }
}

const isString = (value: unknown): value is string => typeof value === 'string'

/** A saved bag, keeping only well-formed lines. */
export function restoreBag(raw: string | null): BagLine[] {
  let data: unknown
  try {
    data = JSON.parse(raw ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  return data
    .filter(
      (line): line is BagLine =>
        line &&
        typeof line === 'object' &&
        isString(line.optionId) &&
        isString(line.slug) &&
        isString(line.name) &&
        isString(line.label) &&
        Array.isArray(line.modifierIds) &&
        line.modifierIds.every(isString) &&
        Array.isArray(line.modifierNames) &&
        line.modifierNames.every(isString) &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        line.quantity <= MAX_ITEM_QUANTITY &&
        Number.isSafeInteger(line.unitCents) &&
        line.unitCents >= 0,
    )
    .slice(0, MAX_LINES)
}

export const bagCount = (lines: BagLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0)
export const bagSubtotal = (lines: BagLine[]) =>
  lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0)
