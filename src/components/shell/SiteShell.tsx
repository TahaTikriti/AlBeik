import type { ReactNode } from 'react'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { Footer } from './Footer'
import { DishPreload } from './DishPreload'
import { Header } from './Header'
import { Spotlight } from './Spotlight'
import { StickyOrderBar, StickyOrderBarSpacer } from './StickyOrderBar'

export function SiteShell({ site, children }: { site: SiteVM; children: ReactNode }) {
  const canOrder = site.storeOrderLinks.length > 0
  return (
    <>
      <a href="#main" className="skip-link">
        {copy.skipToContent}
      </a>
      <Header site={site} />
      {/* overflow-x: clip keeps anything mid-animation (a title sliding in from
          the side) from widening the page: on phones that makes the whole page
          pan sideways and pushes the fixed order bar off-screen. clip, not
          hidden: no scroll container, so sticky chips and scroll timelines work. */}
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        {children}
      </main>
      <Footer site={site} />
      <Spotlight />
      <DishPreload />
      {canOrder ? (
        <>
          <StickyOrderBarSpacer />
          <StickyOrderBar links={site.storeOrderLinks} />
        </>
      ) : null}
    </>
  )
}
