import { createHash } from 'node:crypto'

import type { MenuItemVM } from '@/lib/data/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-spike/basket'

import { type CardConfig, type CloverConfig, cloverUrls } from './config'
import { CardError, type CardProduct, type CardQuote } from './types'

type Sandbox = CloverConfig
type Option = CardProduct['options'][number]
type Mapping = { slug: string; itemId: string; extras: { groupId: string; modifierId: string }[] }

const previewMenu = [
  { slug: 'chicken-tawouk-sandwich', name: 'Chicken Tawouk Sandwich', combo: 1724 },
  { slug: 'albeik-smashed-burger', name: 'AlBeik Smashed Burger', combo: 1669 },
  { slug: 'falafel-sandwich', name: 'Falafel Sandwich', combo: 1724 },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
}

function parseMapping(json: string): Mapping[] {
  const badMapping = new CardError('Check the Clover menu mapping.', 503)
  let entries: unknown
  try {
    entries = JSON.parse(json)
  } catch {
    throw badMapping
  }
  if (!Array.isArray(entries) || !entries.length) throw badMapping
  const itemIds = new Set<string>()
  return entries.map((entry: unknown) => {
    if (!isRecord(entry) || !isId(entry.slug) || !isId(entry.itemId) || itemIds.has(entry.itemId))
      throw badMapping
    itemIds.add(entry.itemId)
    const extras = entry.extras ?? []
    if (!Array.isArray(extras)) throw badMapping
    const modifierIds = new Set<string>()
    return {
      slug: entry.slug,
      itemId: entry.itemId,
      extras: extras.map((extra: unknown) => {
        if (
          !isRecord(extra) ||
          !isId(extra.groupId) ||
          !isId(extra.modifierId) ||
          modifierIds.has(extra.modifierId)
        )
          throw badMapping
        modifierIds.add(extra.modifierId)
        return { groupId: extra.groupId, modifierId: extra.modifierId }
      }),
    }
  })
}

async function cloverRead(
  config: Sandbox,
  path: string,
  body?: unknown,
): Promise<Record<string, unknown> | null> {
  const url =
    cloverUrls(config.env).platform +
    encodeURIComponent(config.merchantId) +
    '/' +
    path
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
    if (response.status === 404 && body === undefined) return null
    if (!response.ok) throw unavailable
    const data: unknown = await response.json()
    if (!isRecord(data)) throw unavailable
    return data
  } catch {
    throw unavailable
  }
}

async function loadOption(
  item: Record<string, unknown> | undefined,
  mapping: Mapping,
  readModifier: (groupId: string, modifierId: string) => Promise<Record<string, unknown> | null>,
): Promise<Option | null> {
  if (!item || item.deleted === true || item.hidden === true) return null
  if (
    item.id !== mapping.itemId ||
    !isCents(item.price) ||
    typeof item.name !== 'string' ||
    !item.name ||
    item.priceType !== 'FIXED'
  )
    throw new CardError('The pickup menu requires fixed-price Clover inventory items.', 503)

  const groups = isRecord(item.modifierGroups) ? item.modifierGroups.elements : []
  if (
    !Array.isArray(groups) ||
    groups.some((group: unknown) => !isRecord(group) || !isId(group.id))
  )
    throw new CardError('Clover could not verify the pickup item’s modifier groups.', 503)
  // This spike offers one optional extra per unit. Keep required-choice items off sale.
  const requiresSelection = groups.some((group) => Number(group.minRequired ?? 0) > 0)
  const stockQuantity = isRecord(item.itemStock) ? item.itemStock.quantity : undefined
  const stockLimit =
    item.autoManage === true
      ? typeof stockQuantity === 'number' && Number.isFinite(stockQuantity)
        ? Math.max(0, Math.floor(stockQuantity))
        : 0
      : undefined

  const extras = await Promise.all(
    mapping.extras.map(async ({ groupId, modifierId }) => {
      if (!groups.some((group) => group.id === groupId)) return null
      const modifier = await readModifier(groupId, modifierId)
      if (!modifier || modifier.available !== true) return null
      if (
        modifier.id !== modifierId ||
        !isCents(modifier.price) ||
        typeof modifier.name !== 'string' ||
        !modifier.name
      )
        throw new CardError('Clover could not verify the pickup extra.', 503)
      return { id: modifierId, name: modifier.name, priceCents: modifier.price }
    }),
  )

  return {
    id: mapping.itemId,
    name: item.name,
    priceCents: item.price,
    available: item.available === true && !requiresSelection && stockLimit !== 0,
    stockLimit,
    extras: extras.filter((extra) => extra !== null),
  }
}

async function loadMappedOptions(config: Sandbox, mapping: Mapping[]) {
  if (!mapping.length) return []
  const inventory = new Map<string, Record<string, unknown>>()
  for (let start = 0; start < mapping.length; start += 100) {
    const ids = mapping.slice(start, start + 100).map(({ itemId }) => "'" + itemId + "'")
    const result = await cloverRead(
      config,
      'items?expand=modifierGroups,itemStock&filter=' +
        encodeURIComponent('id in (' + ids.join(',') + ')'),
    )
    if (!Array.isArray(result?.elements)) {
      throw new CardError('Clover could not verify the pickup inventory.', 503)
    }
    for (const item of result.elements) {
      if (isRecord(item) && isId(item.id)) inventory.set(item.id, item)
    }
  }

  const modifiers = new Map<string, Promise<Record<string, unknown> | null>>()
  const readModifier = (groupId: string, modifierId: string) => {
    const path = 'modifier_groups/' + groupId + '/modifiers/' + modifierId
    const existing = modifiers.get(path)
    if (existing) return existing
    const request = cloverRead(config, path)
    modifiers.set(path, request)
    return request
  }
  return Promise.all(
    mapping.map(async (entry) => ({
      slug: entry.slug,
      option: await loadOption(inventory.get(entry.itemId), entry, readModifier),
    })),
  )
}

export async function loadCardProducts(
  config: CardConfig,
  items: MenuItemVM[],
  mapping = '[]',
): Promise<CardProduct[]> {
  const catalog =
    config.mode === 'clover'
      ? await loadMappedOptions(
          config,
          parseMapping(mapping).filter((entry) =>
            items.some((item) => item.slug === entry.slug),
          ),
        )
      : previewMenu.flatMap(({ slug, name, combo }) =>
          [false, true].map((isCombo) => ({
            slug,
            option: {
              id: 'demo-' + slug + (isCombo ? '-combo' : ''),
              name: name + (isCombo ? ' Combo' : ''),
              priceCents: isCombo ? combo : 1165,
              available: true,
              extras: [{ id: 'demo-extra-sauce', name: 'Extra sauce', priceCents: 75 }],
            },
          })),
        )

  const products = new Map<string, CardProduct>()
  for (const { slug, option } of catalog) {
    const item = items.find((item) => item.slug === slug)
    if (!item || !option) continue
    const product = products.get(slug) ?? {
      slug,
      name: item.name,
      description: item.description,
      image: item.image,
      options: [],
    }
    product.options.push(option)
    products.set(slug, product)
  }
  return [...products.values()]
}

export async function quoteCardBasket(config: CardConfig, products: CardProduct[], input: unknown) {
  const invalid = new CardError('Please check the items and quantities in your bag.', 400)
  if (!Array.isArray(input) || !input.length || input.length > 50) throw invalid
  const options = new Map(
    products.flatMap((product) => product.options.map((option) => [option.id, option] as const)),
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
      !Array.isArray(line.extraIds) ||
      line.extraIds.length > 1 ||
      typeof line.quantity !== 'number' ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_ITEM_QUANTITY ||
      line.extraIds.some((id) => typeof id !== 'string')
    )
      throw invalid
    const option = options.get(line.optionId)
    if (!option?.available)
      throw new CardError('An item in your bag is no longer available. Update your bag.', 409)
    const key = JSON.stringify([option.id, line.extraIds])
    if (seen.has(key)) throw invalid
    seen.add(key)
    const quantity = (quantities.get(option.id) ?? 0) + line.quantity
    if (quantity > MAX_ITEM_QUANTITY || (option.stockLimit != null && quantity > option.stockLimit))
      throw new CardError('That quantity is unavailable. Update your bag.', 409)
    quantities.set(option.id, quantity)

    const extras = line.extraIds.map((id) => {
      const extra = option.extras.find((value) => value.id === id)
      if (!extra)
        throw new CardError('An extra in your bag is no longer available. Update your bag.', 409)
      return extra
    })
    const unitCents = extras.reduce((sum, extra) => sum + extra.priceCents, option.priceCents)
    lines.push({
      name: [option.name, ...extras.map((extra) => extra.name)].join(' + '),
      quantity: line.quantity,
      unitCents,
    })
    for (let index = 0; index < line.quantity; index++) {
      lineItems.push({
        item: { id: option.id },
        modifications: extras.map((extra) => ({
          modifier: { id: extra.id },
          name: extra.name,
          amount: extra.priceCents,
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
    if (
      !totals ||
      !isCents(totals.subtotal) ||
      !isCents(totals.totalTaxAmount) ||
      !isCents(totals.total)
    )
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
