'use client'

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * Puts the dish page at the top as it arrives from the menu, before React
 * measures it for the menu-to-dish morph. Next scrolls to the top only after
 * the view transition, so without this the page is still at the menu's
 * scroll position, the dish photo counts as off-screen and the morph is
 * dropped. The screen shows the old page's snapshot meanwhile, so the jump
 * is never seen. Skipped on first load, so a reload keeps its position.
 */
export function ScrollTopOnArrival() {
  // True only when mounted by a client navigation, not by hydration.
  const navigated = useRef(
    !useSyncExternalStore(
      subscribe,
      () => false,
      () => true,
    ),
  )
  useLayoutEffect(() => {
    if (navigated.current && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  return null
}
