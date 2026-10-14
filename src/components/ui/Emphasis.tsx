import { Fragment } from 'react'

import type { RichLine } from '@/lib/data/types'
import { parseEmphasis } from '@/lib/text'

type Props = { line: RichLine; text?: never } | { text: string; line?: never }

/**
 * Display text where *asterisk* words become <em> (the red word from the
 * Instagram posts). Takes a CMS line or a UI copy string.
 */
export function Emphasis(props: Props) {
  const segments = props.line ? props.line.segments : parseEmphasis(props.text)
  return (
    <>
      {segments.map((segment, i) =>
        segment.emphasis ? (
          <em key={i}>{segment.text}</em>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}
