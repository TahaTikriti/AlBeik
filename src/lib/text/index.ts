/**
 * A run of display text. `emphasis` marks the words an editor wrapped in
 * *asterisks*; the theme decides what emphasis looks like.
 */
export type Segment = { text: string; emphasis: boolean }

const EMPHASIS = /\*([^*]+)\*/g

/** Parses `The recipe is *Lebanese*.` into plain and emphasized segments. */
export function parseEmphasis(input: string | null | undefined): Segment[] {
  if (!input) return []

  const segments: Segment[] = []
  let cursor = 0

  for (const match of input.matchAll(EMPHASIS)) {
    const start = match.index
    if (start > cursor) segments.push({ text: input.slice(cursor, start), emphasis: false })
    segments.push({ text: match[1]!, emphasis: true })
    cursor = start + match[0].length
  }
  if (cursor < input.length) segments.push({ text: input.slice(cursor), emphasis: false })

  return segments
}

/** The same text without emphasis markers, for metadata, alt text and JSON-LD. */
export function plainText(input: string | null | undefined): string {
  return parseEmphasis(input)
    .map((s) => s.text)
    .join('')
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
