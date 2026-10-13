import { Fragment } from 'react'

import type { RichLine } from '@/lib/data/types'

/** Renders display text; words the editor wrapped in *asterisks* become <em>. */
export function Emphasis({ line }: { line: RichLine }) {
  return (
    <>
      {line.segments.map((segment, i) =>
        segment.emphasis ? (
          <em key={i}>{segment.text}</em>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}
