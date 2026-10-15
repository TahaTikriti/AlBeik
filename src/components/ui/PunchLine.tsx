import type { CSSProperties } from 'react'

import { emphasisSegments, type EmphasisProps } from './Emphasis'

/**
 * The hero headline, one word at a time: plain words punch up out of a mask
 * in turn, then the red word lands like a stamp (see .punch / .stamp in
 * brand.css). Reads as normal text to assistive tech; static with reduced
 * motion.
 */
export function PunchLine(props: EmphasisProps) {
  let index = 0
  return (
    <>
      {emphasisSegments(props).map((segment, s) =>
        segment.text.split(/(\s+)/).map((part, w) => {
          if (!part) return null
          if (/^\s+$/.test(part)) return part
          const style = { '--i': index++ } as CSSProperties
          return segment.emphasis ? (
            <em key={`${s}-${w}`} className="stamp" style={style}>
              {part}
            </em>
          ) : (
            <span key={`${s}-${w}`} className="punch">
              <span style={style}>{part}</span>
            </span>
          )
        }),
      )}
    </>
  )
}
