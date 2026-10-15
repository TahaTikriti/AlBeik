import { ViewTransition, type ReactNode } from 'react'

/**
 * Remounts on every navigation, so each page leaves with a short lift and
 * the next one rises in (brand.css .page-out / .page-in). The header, footer
 * and order bar live in the layout, outside this, and hold still. The dish
 * morph (MenuItemCard / ItemView) plays inside it.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
