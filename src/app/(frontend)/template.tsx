import { ViewTransition, type ReactNode } from 'react'

/**
 * Remounts on every navigation. The hidden marker below enters and leaves
 * with each page, which makes React run a view transition for every page
 * change; the visible lift itself is on the root (brand.css), a cheap
 * viewport-sized snapshot. The header and order bar are named, so they hold
 * still, and the dish morph (MenuItemCard / ItemView) plays on top.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <ViewTransition enter="page-swap" exit="page-swap" default="none">
        <span hidden />
      </ViewTransition>
      {children}
    </>
  )
}
