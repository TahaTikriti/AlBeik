'use client'

import { useEffect } from 'react'

/**
 * Starts loading a dish page's photo as soon as a finger (or pointer, or
 * keyboard focus) lands on a card that opens it ([data-dish-srcset], see
 * dishPreloadAttrs), so the photo is ready when the page morphs in instead
 * of popping in late. Once per photo; one listener for the whole site.
 */
export function DishPreload() {
  useEffect(() => {
    const done = new Set<string>()
    const onIntent = (event: Event) => {
      const card = (event.target as Element | null)?.closest?.<HTMLElement>('[data-dish-srcset]')
      const srcset = card?.dataset.dishSrcset
      if (!card || !srcset || done.has(srcset)) return
      done.add(srcset)
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.setAttribute('imagesrcset', srcset)
      link.setAttribute('imagesizes', card.dataset.dishSizes ?? '100vw')
      link.setAttribute('fetchpriority', 'high')
      document.head.append(link)
    }
    const types = ['pointerdown', 'pointerover', 'focusin'] as const
    for (const type of types)
      document.addEventListener(type, onIntent, { capture: true, passive: true })
    return () => {
      for (const type of types) document.removeEventListener(type, onIntent, { capture: true })
    }
  }, [])
  return null
}
