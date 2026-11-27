/**
 * Matching the site's dishes to Clover items by name, so the owner doesn't
 * paste 59 item IDs by hand. "<Dish> Combo" becomes the dish's Combo option.
 */

export type CloverItem = { id: string; name: string; price: number }
type Option = { label: string; cloverItemId: string }

export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/^the /, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "Sandwich" for a sandwich sold beside its combo; "Regular" otherwise. */
function baseLabel(dishName: string, hasCombo: boolean) {
  if (!hasCombo) return 'Regular'
  const last = normalizeName(dishName).split(' ').at(-1) ?? ''
  return ['sandwich', 'burger', 'wrap', 'shawarma'].includes(last)
    ? last[0]!.toUpperCase() + last.slice(1)
    : 'Regular'
}

export function matchDishes(
  dishes: { id: number; name: string; hasLinks: boolean }[],
  items: CloverItem[],
) {
  const byName = new Map(items.map((item) => [normalizeName(item.name), item]))
  const linked: { dishId: number; options: (Option & { priceCents: number })[] }[] = []
  const unmatched: string[] = []
  for (const dish of dishes) {
    if (dish.hasLinks) continue
    const key = normalizeName(dish.name)
    const base = byName.get(key)
    if (!base) {
      unmatched.push(dish.name)
      continue
    }
    const combo = byName.get(key + ' combo')
    linked.push({
      dishId: dish.id,
      options: [
        { label: baseLabel(dish.name, Boolean(combo)), cloverItemId: base.id, priceCents: base.price },
        ...(combo ? [{ label: 'Combo', cloverItemId: combo.id, priceCents: combo.price }] : []),
      ],
    })
  }
  return { linked, unmatched }
}

/** The site's display prices from Clover: the first option's and the Combo's, in dollars. */
export function pricesFromClover(options: Option[], items: Map<string, CloverItem>) {
  const prices: { price?: number; comboPrice?: number } = {}
  const combo = options.find((o) => /combo/i.test(o.label))
  const base = options.find((o) => o !== combo)
  const baseItem = base && items.get(base.cloverItemId)
  const comboItem = combo && items.get(combo.cloverItemId)
  if (baseItem) prices.price = baseItem.price / 100
  if (comboItem) prices.comboPrice = comboItem.price / 100
  return prices
}
