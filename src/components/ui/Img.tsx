import Image from 'next/image'

import type { ImageVM } from '@/lib/data/types'

type Props = {
  image: ImageVM
  /** Required: how wide the image renders, e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes: string
  /** Preload the above-the-fold (LCP) image. */
  preload?: boolean
  className?: string
}

/** next/image from a view-model image: intrinsic size (no layout shift), focal point honored. */
export function Img({ image, sizes, preload, className }: Props) {
  return (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={preload}
      className={className}
      style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }}
    />
  )
}
