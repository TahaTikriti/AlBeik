import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import { WebOrdersLive } from './WebOrdersLive'
import './dashboard.scss'

/** /admin/web-orders: today's website orders, live, for the counter or the kitchen tablet. */
export async function WebOrdersView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  // Custom admin views are public unless they say otherwise.
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fweb-orders')
  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter className="ab-dash">
        <WebOrdersLive timeZone={settings.timezone || 'America/Chicago'} />
      </Gutter>
    </DefaultTemplate>
  )
}
