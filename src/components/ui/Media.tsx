import type { MediaVM } from '@/lib/data/types'

import { Img } from './Img'

type Props = { media: MediaVM; sizes: string; preload?: boolean; className?: string }

export function Media({ media, sizes, preload, className }: Props) {
  if (media.kind === 'video') {
    return (
      <video
        src={media.url}
        className={className}
        aria-label={media.alt}
        muted
        playsInline
        controls
        preload="metadata"
      />
    )
  }
  return <Img image={media} sizes={sizes} preload={preload} className={className} />
}
