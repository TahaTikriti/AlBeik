import type { CardModifier, CardModifierGroup, CardOption } from '@/lib/pickup-card/types'

/** Modifier IDs picked in each group, by group ID. */
export type Picks = Record<string, string[]>

/** A required choice with only one possible answer is made for the customer. */
export function startingPicks(option: CardOption): Picks {
  const picks: Picks = {}
  for (const group of option.groups)
    if (group.min > 0 && group.modifiers.length === group.min) picks[group.id] = group.modifiers.map((m) => m.id)
  return picks
}

export function togglePick(picks: Picks, group: CardModifierGroup, id: string): Picks {
  const list = picks[group.id] ?? []
  if (group.max === 1) return { ...picks, [group.id]: list[0] === id && group.min === 0 ? [] : [id] }
  if (list.includes(id)) return { ...picks, [group.id]: list.filter((x) => x !== id) }
  if (group.max !== null && list.length >= group.max) return picks
  return { ...picks, [group.id]: [...list, id] }
}

export function firstMissing(option: CardOption, picks: Picks): CardModifierGroup | null {
  return option.groups.find((g) => (picks[g.id]?.length ?? 0) < g.min) ?? null
}

export function chosenModifiers(option: CardOption, picks: Picks): CardModifier[] {
  return option.groups.flatMap((g) => (picks[g.id] ?? []).flatMap((id) => g.modifiers.filter((m) => m.id === id)))
}

export function unitPrice(option: CardOption, picks: Picks): number {
  return chosenModifiers(option, picks).reduce((sum, m) => sum + m.priceCents, option.priceCents)
}
