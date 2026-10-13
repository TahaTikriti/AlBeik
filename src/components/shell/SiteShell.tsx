import type { ReactNode } from 'react'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { Footer } from './Footer'
import { Header } from './Header'
import { StickyOrderBar, StickyOrderBarSpacer } from './StickyOrderBar'

export function SiteShell({ site, children }: { site: SiteVM; children: ReactNode }) {
  const canOrder = site.storeOrderLinks.length > 0
  return (
    <>
      <a href="#main" className="skip-link">
        {copy.skipToContent}
      </a>
      <Header site={site} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer site={site} />
      {canOrder ? (
        <>
          <StickyOrderBarSpacer />
          <StickyOrderBar links={site.storeOrderLinks} />
        </>
      ) : null}
    </>
  )
}
