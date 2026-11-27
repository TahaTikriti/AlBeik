import type { ReactNode } from 'react'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { Footer } from './Footer'
import { DishPreload } from './DishPreload'
import { Header } from './Header'
import { OfferBanner } from './OfferBanner'
import { BagBarSwitch } from '../order/bag/BagBar'
import { BagProvider } from '../order/bag/BagProvider'
import { StickyOrderBar, StickyOrderBarSpacer } from './StickyOrderBar'

export function SiteShell({ site, children }: { site: SiteVM; children: ReactNode }) {
  const canOrder = site.storeOrderLinks.length > 0 || site.pickup.enabled
  const location = site.locations[0]
  return (
    <BagProvider
      contact={{ phone: location?.phone ?? null, phoneHref: location?.phoneHref ?? null }}
      online={site.pickup.enabled}
    >
      <a href="#main" className="skip-link">
        {copy.skipToContent}
      </a>
      {site.banner ? <OfferBanner banner={site.banner} /> : null}
      <Header site={site} />
      {/* overflow-x: clip keeps anything mid-animation (a title sliding in from
          the side) from widening the page: on phones that makes the whole page
          pan sideways and pushes the fixed order bar off-screen. clip, not
          hidden: no scroll container, so sticky chips and scroll timelines work. */}
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        {children}
      </main>
      <Footer site={site} />
      <DishPreload />
      {canOrder ? (
        <>
          <StickyOrderBarSpacer />
          <BagBarSwitch>
            {site.storeOrderLinks.length ? <StickyOrderBar links={site.storeOrderLinks} /> : null}
          </BagBarSwitch>
        </>
      ) : null}
    </BagProvider>
  )
}
