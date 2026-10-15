import { Fragment } from 'react'

import type { RichLine } from '@/lib/data/types'
import { parseEmphasis } from '@/lib/text'

type Props = { line: RichLine; text?: never } | { text: string; line?: never }

/** Punctuation that sits right after a highlighted word ("*Lebanese*."). */
const TRAILING_PUNCTUATION = /^[.,!?:;]+/

/**
 * Display text where *asterisk* words become <em> (the red word from the
 * Instagram posts). Takes a CMS line or a UI copy string. Punctuation right
 * after a highlighted word takes its color, so a lone white period doesn't
 * trail a red word.
 */
export function Emphasis(props: Props) {
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
  return (
    <>
      {segments.map((segment, i) =>
        !segment.text ? null : segment.emphasis ? (
          <em key={i}>{segment.text}</em>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}
