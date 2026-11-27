import { createHash } from 'node:crypto'

import type { MenuItemVM } from '@/lib/data/types'

import { type CardConfig, type CloverConfig, cloverUrls } from './config'
import {
  CardError,
  MAX_ITEM_QUANTITY,
  type CardModifierGroup,
  type CardOption,
  type CardProduct,
  type CardQuote,
  type PickupLink,
} from './types'

type JObject = Record<string, unknown>

/** Most modifiers one unit can carry. */
const MAX_MODIFIERS = 20

function isRecord(value: unknown): value is JObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
}

function elements(value: unknown): unknown[] {
  const list = isRecord(value) ? value.elements : value
  return Array.isArray(list) ? list : []
}

async function cloverRead(config: CloverConfig, path: string, body?: unknown): Promise<JObject> {
  const url = cloverUrls(config.env).platform + encodeURIComponent(config.merchantId) + '/' + path
  const unavailable = new CardError(
    'Clover could not verify the menu or total. Please try again.',
    503,
  )
  try {
    const response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        authorization: 'Bearer ' + config.restToken,
        'content-type': 'application/json',
        'user-agent': 'AlBeikPickup/1.0',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw unavailable
    const data: unknown = await response.json()
    if (!isRecord(data)) throw unavailable
    return data
  } catch {
    throw unavailable
  }
}

/** Clover's modifier group → what the customer picks from. Unavailable modifiers drop out. */
function toGroup(raw: JObject): CardModifierGroup | null {
  if (!isId(raw.id) || typeof raw.name !== 'string') return null
  const min = Number(raw.minRequired ?? 0)
  const max = Number(raw.maxAllowed ?? 0)
  const modifiers = elements(raw.modifiers).flatMap((entry) =>
    isRecord(entry) &&
    isId(entry.id) &&
    typeof entry.name === 'string' &&
    entry.name &&
    isCents(entry.price ?? 0) &&
    entry.available !== false
      ? [{ id: entry.id, name: entry.name, priceCents: (entry.price as number | undefined) ?? 0 }]
      : [],
  )
  return {
    id: raw.id,
    name: raw.name,
    min: Number.isInteger(min) && min > 0 ? min : 0,
    max: Number.isInteger(max) && max > 0 ? max : null,
    modifiers,
  }
}

function toOption(
  item: JObject | undefined,
  label: string,
  groups: Map<string, CardModifierGroup>,
): CardOption | null {
  if (!item || item.deleted === true || item.hidden === true) return null
  if (
    !isId(item.id) ||
    !isCents(item.price) ||
    typeof item.name !== 'string' ||
    !item.name ||
    item.priceType !== 'FIXED'
  )
    throw new CardError('The pickup menu requires fixed-price Clover inventory items.', 503)
  const stockQuantity = isRecord(item.itemStock) ? item.itemStock.quantity : undefined
  const stockLimit =
    item.autoManage === true
      ? typeof stockQuantity === 'number' && Number.isFinite(stockQuantity)
        ? Math.max(0, Math.floor(stockQuantity))
        : 0
      : undefined
  const itemGroups = elements(item.modifierGroups).flatMap((entry) => {
    const group = isRecord(entry) && isId(entry.id) ? groups.get(entry.id) : undefined
    return group ? [group] : []
  })
  // A required group with nothing left to pick can't be satisfied.
  const blocked = itemGroups.some((group) => group.min > group.modifiers.length)
  return {
    id: item.id,
    label,
    name: item.name,
    priceCents: item.price,
    available: item.available === true && stockLimit !== 0 && !blocked,
    ...(stockLimit === undefined ? {} : { stockLimit }),
    groups: itemGroups,
  }
}

async function loadCloverOptions(config: CloverConfig, links: PickupLink[]) {
  const ids = [...new Set(links.flatMap((link) => link.options.map((o) => o.cloverItemId)))]
  if (!ids.length) return new Map<string, CardOption | null>()
  const inventory = new Map<string, JObject>()
  const batches: Promise<JObject>[] = []
  for (let start = 0; start < ids.length; start += 100) {
    const filter = 'id in (' + ids.slice(start, start + 100).map((id) => "'" + id + "'").join(',') + ')'
    batches.push(
      cloverRead(
        config,
        'items?expand=modifierGroups,itemStock&limit=1000&filter=' + encodeURIComponent(filter),
      ),
    )
  }
  const [groupData, ...itemPages] = await Promise.all([
    cloverRead(config, 'modifier_groups?expand=modifiers&limit=1000'),
    ...batches,
  ])
  for (const page of itemPages) {
    if (!Array.isArray(page.elements))
      throw new CardError('Clover could not verify the pickup inventory.', 503)
    for (const item of page.elements) if (isRecord(item) && isId(item.id)) inventory.set(item.id, item)
  }
  const groups = new Map<string, CardModifierGroup>()
  for (const raw of elements(groupData)) {
    const group = isRecord(raw) ? toGroup(raw) : null
    if (group) groups.set(group.id, group)
  }
  const options = new Map<string, CardOption | null>()
  for (const link of links)
    for (const { label, cloverItemId } of link.options)
      options.set(link.slug + '|' + cloverItemId, toOption(inventory.get(cloverItemId), label, groups))
  return options
}

/** Preview: site prices, a required side and an optional sauce, no network. */
function previewOption(item: MenuItemVM, label: string, id: string, index: number): CardOption {
  const dollars =
    /combo/i.test(label) && item.comboPrice !== null
      ? item.comboPrice
      : index === 0 && item.price !== null
        ? item.price
        : (item.sizes[index - 1]?.price ?? item.price ?? 11.65)
  return {
    id,
    label,
    name: /combo/i.test(label) ? item.name + ' Combo' : item.name,
    priceCents: Math.round(dollars * 100),
    available: true,
    groups: [
      {
        id: 'demo-side',
        name: 'Side',
        min: 1,
        max: 1,
        modifiers: [
          { id: 'demo-side-fries', name: 'Fries', priceCents: 0 },
          { id: 'demo-side-salad', name: 'Salad', priceCents: 100 },
        ],
      },
      {
        id: 'demo-extras',
        name: 'Extras',
        min: 0,
        max: null,
        modifiers: [{ id: 'demo-extra-sauce', name: 'Extra sauce', priceCents: 75 }],
      },
    ],
  }
}

/** The dishes customers can add, with live Clover prices, stock and choices. */
export async function loadCardProducts(
  config: CardConfig,
  links: PickupLink[],
  items: MenuItemVM[],
): Promise<CardProduct[]> {
  const bySlug = new Map(items.map((item) => [item.slug, item]))
  const usable = links.filter((link) => bySlug.has(link.slug) && link.options.length)
  const cloverOptions = config.mode === 'clover' ? await loadCloverOptions(config, usable) : null
  return usable.flatMap((link) => {
    const item = bySlug.get(link.slug)!
    const options = link.options.flatMap(({ label, cloverItemId }, index) => {
      const option = cloverOptions
        ? cloverOptions.get(link.slug + '|' + cloverItemId)
        : previewOption(item, label, cloverItemId, index)
      return option ? [option] : []
    })
    return options.length
      ? [{ slug: link.slug, name: item.name, description: item.description, image: item.image, options }]
      : []
  })
}

/** Throws a 409 the customer can act on when the picks break a group's limits. */
export function validateModifiers(option: CardOption, modifierIds: string[]) {
  const counts = new Map<string, number>()
  for (const id of modifierIds) {
    const group = option.groups.find((g) => g.modifiers.some((m) => m.id === id))
    if (!group)
      throw new CardError('An extra in your bag is no longer available. Update your bag.', 409)
    counts.set(group.id, (counts.get(group.id) ?? 0) + 1)
  }
  for (const group of option.groups) {
    const count = counts.get(group.id) ?? 0
    if (count < group.min)
      throw new CardError(`Choose ${group.name.toLowerCase()} for ${option.label}.`, 409)
    if (group.max !== null && count > group.max)
      throw new CardError(
        `Pick up to ${group.max} ${group.name.toLowerCase()} for ${option.label}.`,
        409,
      )
  }
}

export async function quoteCardBasket(config: CardConfig, products: CardProduct[], input: unknown) {
  const invalid = new CardError('Please check the items and quantities in your bag.', 400)
  if (!Array.isArray(input) || !input.length || input.length > 50) throw invalid
  const options = new Map(
    products.flatMap((product) => product.options.map((option) => [option.id, option] as const)),
  )
  // Everything gone since the bag was filled, at once, so the bag drops just those lines.
  const gone = input.flatMap((line, index) => {
    if (!isRecord(line) || typeof line.optionId !== 'string' || !Array.isArray(line.modifierIds)) return []
    const option = options.get(line.optionId)
    const offered = new Set(option?.groups.flatMap((g) => g.modifiers.map((m) => m.id)))
    return option?.available && line.modifierIds.every((id) => offered.has(id as string)) ? [] : [index]
  })
  if (gone.length)
    throw new CardError(
      'An item in your bag is no longer available. Update your bag.',
      409,
      'unavailable',
      { lines: gone },
    )
  const seen = new Set<string>()
  const quantities = new Map<string, number>()
  const lines: CardQuote['lines'] = []
  const lineItems: {
    item: { id: string }
    modifications: { modifier: { id: string }; name: string; amount: number }[]
  }[] = []
  for (const line of input) {
    if (
      !isRecord(line) ||
      typeof line.optionId !== 'string' ||
      !Array.isArray(line.modifierIds) ||
      line.modifierIds.length > MAX_MODIFIERS ||
      line.modifierIds.some((id) => typeof id !== 'string') ||
      new Set(line.modifierIds).size !== line.modifierIds.length ||
      typeof line.quantity !== 'number' ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_ITEM_QUANTITY
    )
      throw invalid
    const modifierIds = line.modifierIds as string[]
    const option = options.get(line.optionId)
    if (!option?.available)
      throw new CardError('An item in your bag is no longer available. Update your bag.', 409)
    const key = JSON.stringify([option.id, [...modifierIds].sort()])
    if (seen.has(key)) throw invalid
    seen.add(key)
    const quantity = (quantities.get(option.id) ?? 0) + line.quantity
    if (quantity > MAX_ITEM_QUANTITY || (option.stockLimit != null && quantity > option.stockLimit))
      throw new CardError('That quantity is unavailable. Update your bag.', 409)
    quantities.set(option.id, quantity)

    validateModifiers(option, modifierIds)
    const modifiers = modifierIds.map(
      (id) => option.groups.flatMap((g) => g.modifiers).find((m) => m.id === id)!,
    )
    const unitCents = modifiers.reduce((sum, m) => sum + m.priceCents, option.priceCents)
    lines.push({
      name: [option.name, ...modifiers.map((m) => m.name)].join(' + '),
      quantity: line.quantity,
      unitCents,
    })
    for (let index = 0; index < line.quantity; index++) {
      lineItems.push({
        item: { id: option.id },
        modifications: modifiers.map((m) => ({
          modifier: { id: m.id },
          name: m.name,
          amount: m.priceCents,
        })),
      })
    }
  }
  if (lineItems.length > 50) throw invalid
  const orderCart = {
    orderType: { id: config.mode === 'clover' ? config.orderTypeId : 'demo-pickup' },
    lineItems,
  }
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0)
  // Deterministic demo tax. A connected checkout takes its tax only from Clover.
  let taxCents = Math.round(subtotalCents * 0.08)
  if (config.mode === 'clover') {
    const totals = await cloverRead(config, 'atomic_order/checkouts', { orderCart })
    if (!isCents(totals.subtotal) || !isCents(totals.totalTaxAmount) || !isCents(totals.total))
      throw new CardError('Clover could not confirm the total for this checkout.', 503)
    if (
      totals.subtotal !== subtotalCents ||
      totals.subtotal + totals.totalTaxAmount !== totals.total
    )
      throw new CardError(
        'The Clover total differs from the menu. Refresh your bag before paying.',
        409,
      )
    taxCents = totals.totalTaxAmount
  }
  const totalCents = subtotalCents + taxCents
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw invalid
  const quoteId = createHash('sha256')
    .update(
      JSON.stringify([
        config.mode === 'clover' ? config.merchantId : 'preview',
        orderCart,
        lines,
        taxCents,
        totalCents,
      ]),
    )
    .digest('hex')
  return { quote: { lines, subtotalCents, taxCents, totalCents, quoteId }, orderCart }
}
