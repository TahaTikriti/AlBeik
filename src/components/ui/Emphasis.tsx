import { Fragment } from 'react'

import type { RichLine } from '@/lib/data/types'
import { parseEmphasis } from '@/lib/text'

export type EmphasisProps = { line: RichLine; text?: never } | { text: string; line?: never }

/** Punctuation that sits right after a highlighted word ("*Lebanese*."). */
const TRAILING_PUNCTUATION = /^[.,!?:;]+/

/**
 * The line's segments with punctuation right after a highlighted word moved
 * into it ("*Lebanese*." → "Lebanese." in red), so a lone white period
 * doesn't trail a red word.
 */
export function emphasisSegments(props: EmphasisProps): RichLine['segments'] {
  const segments = (props.line ? props.line.segments : parseEmphasis(props.text)).map((s) => ({
    ...s,
  }))
  for (let i = 1; i < segments.length; i++) {
    const [prev, cur] = [segments[i - 1]!, segments[i]!]
    const punctuation = !cur.emphasis && prev.emphasis && TRAILING_PUNCTUATION.exec(cur.text)?.[0]
    if (punctuation) {
      prev.text += punctuation
      cur.text = cur.text.slice(punctuation.length)
    }
  }
  return segments.filter((s) => s.text)
}

/**
 * Display text where *asterisk* words become <em> (the red word from the
 * Instagram posts). Takes a CMS line or a UI copy string.
 */
export function Emphasis(props: EmphasisProps) {
  return (
    <>
      {emphasisSegments(props).map((segment, i) =>
        segment.emphasis ? (
          <em key={i}>{segment.text}</em>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}

/**
 * Splits a display line after its first sentence ("Lebanese flavor. *Kansas
 * City* welcome."), for headlines set a line per sentence.
 */
export function splitFirstSentence(line: RichLine): [RichLine, RichLine | null] {
  const first: RichLine['segments'] = []
  for (const [i, segment] of line.segments.entries()) {
    const stop = segment.emphasis ? -1 : segment.text.indexOf('.')
    if (stop === -1) {
      first.push(segment)
      continue
    }
    first.push({ text: segment.text.slice(0, stop + 1), emphasis: false })
    const rest = [
      { text: segment.text.slice(stop + 1).trimStart(), emphasis: false },
      ...line.segments.slice(i + 1),
    ].filter((s) => s.text)
    const text = (segs: RichLine['segments']) => segs.map((s) => s.text).join('')
    return [
      { segments: first, text: text(first) },
      rest.length ? { segments: rest, text: text(rest) } : null,
    ]
  }
  return [line, null]
}
