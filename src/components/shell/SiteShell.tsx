import type { ReactNode } from 'react'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { Footer } from './Footer'
import { Header } from './Header'
import { TabBar, TabBarSpacer } from './TabBar'

export function SiteShell({ site, children }: { site: SiteVM; children: ReactNode }) {
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
      <TabBarSpacer />
      <TabBar storeLinks={site.storeOrderLinks} />
    </>
  )
}
