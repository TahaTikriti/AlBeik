import { getImageProps } from 'next/image'

import type { ImageVM } from '@/lib/data/types'

/** How wide the dish page's photo renders (ItemView). */
export const DISH_PAGE_IMAGE_SIZES = '(min-width: 1216px) 36rem, (min-width: 768px) 46vw, 100vw'

/**
 * Data attributes for a card that opens a dish: the exact srcset the dish
 * page's photo will request, so DishPreload can fetch it the moment the card
 * is touched and the photo is there when the page morphs in.
 */
export function dishPreloadAttrs(image: ImageVM | null) {
  if (!image) return {}
  const { props } = getImageProps({
    src: image.url,
    alt: '',
    width: image.width,
    height: image.height,
    sizes: DISH_PAGE_IMAGE_SIZES,
  })
  return { 'data-dish-srcset': props.srcSet, 'data-dish-sizes': props.sizes }
}
