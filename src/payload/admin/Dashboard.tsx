import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import type { ReactNode } from 'react'

import { startOfDay } from '@/lib/hours'

import './dashboard.scss'

/**
 * The admin's home page, in place of Payload's default one. Built for the
 * restaurant: a greeting, what's live on the site right now (each tile opens
 * the matching list), the everyday jobs as one-tap actions, and every section
 * of the admin with a line on what it's for.
 */

const ADMIN = '/admin'
const DISHES = `${ADMIN}/collections/menu-items`
const SETTINGS = `${ADMIN}/globals/site-settings`
const WEB_ORDERS = `${ADMIN}/web-orders`

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Banner = {
  enabled?: boolean | null
  text?: string | null
  startsAt?: string | null
  endsAt?: string | null
}

/** The offer banner as the site shows it at this moment. */
function bannerStatus(banner: Banner | null | undefined, timeZone: string) {
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone })
  const now = Date.now()
  if (!banner?.enabled || !banner.text?.trim()) return { value: 'Off', note: 'No banner showing' }
  if (banner.startsAt && Date.parse(banner.startsAt) > now) {
    return { value: 'Scheduled', note: `Starts ${day(banner.startsAt)}` }
  }
  if (banner.endsAt && Date.parse(banner.endsAt) <= now) {
    return { value: 'Ended', note: `Ended ${day(banner.endsAt)}` }
  }
  return { value: 'On', note: banner.endsAt ? `Until ${day(banner.endsAt)}` : 'Showing now' }
}

function greeting(timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(),
  )
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export async function Dashboard({ payload, user }: AdminViewServerProps) {
  const [onMenu, hidden, deals, settings] = await Promise.all([
    payload.count({ collection: 'menu-items', where: { available: { equals: true } } }),
    payload.count({ collection: 'menu-items', where: { available: { equals: false } } }),
    payload.find({
      collection: 'menu-items',
      where: { and: [{ dealPrice: { exists: true } }, { available: { equals: true } }] },
      sort: 'name',
      limit: 3,
      depth: 0,
      select: { name: true, dealPrice: true },
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])

  const timeZone = settings.timezone || 'America/Chicago'
  const banner = bannerStatus(settings.banner, timeZone)
  const online = Boolean(settings.onlinePickup)
  const today = online
    ? await payload.find({
        collection: 'web-orders',
        where: {
          and: [
            { status: { equals: 'paid' } },
            { createdAt: { greater_than_equal: startOfDay(timeZone).toISOString() } },
          ],
        },
        limit: 500,
        depth: 0,
        pagination: false,
        select: { totalCents: true },
      })
    : null
  const todayTotal = today?.docs.reduce((sum, o) => sum + (o.totalCents ?? 0), 0) ?? 0
  const name =
    (user && 'name' in user && typeof user.name === 'string' && user.name.trim()) ||
    (user?.email ? String(user.email).split('@')[0] : '')
  const site = process.env.NEXT_PUBLIC_SERVER_URL || '/'

  const dealNote = deals.docs.length
    ? deals.docs
        .map((d) => `${d.name} ${typeof d.dealPrice === 'number' ? money.format(d.dealPrice) : ''}`)
        .join(' · ') + (deals.totalDocs > deals.docs.length ? ' …' : '')
    : 'No deals running'

  return (
    <Gutter className="ab-dash">
      <header className="ab-dash__head">
        <div>
          <h1 className="ab-dash__title">
            {greeting(timeZone)}
            {name ? `, ${name}` : ''}
          </h1>
          <p className="ab-dash__lede">
            Everything you change here is on the website as soon as you press{' '}
            <strong>Publish changes</strong>.
          </p>
        </div>
        <a className="ab-dash__site" href={site} target="_blank" rel="noreferrer">
          View the website <Icon name="external" />
        </a>
      </header>

      {settings.showPrices === false ? (
        <a className="ab-dash__alert" href={SETTINGS}>
          <Icon name="alert" />
          <span>
            <strong>Prices are hidden on the website.</strong> Turn on “Show prices” in Site
            settings to show them.
          </span>
        </a>
      ) : null}

      <section aria-labelledby="ab-now">
        <h2 id="ab-now" className="ab-dash__h2">
          Right now
        </h2>
        <ul className="ab-dash__stats">
          {today ? (
            <Stat
              href={WEB_ORDERS}
              label="Web orders today"
              value={today.docs.length}
              note={today.docs.length ? `${money.format(todayTotal / 100)} paid` : 'none yet'}
              accent={today.docs.length > 0}
              muted={!today.docs.length}
            />
          ) : null}
          <Stat
            href={`${DISHES}?where[available][equals]=true`}
            label="On the menu"
            value={onMenu.totalDocs}
            note="dishes showing on the site"
          />
          <Stat
            href={`${DISHES}?where[available][equals]=false`}
            label="Hidden"
            value={hidden.totalDocs}
            note={hidden.totalDocs ? 'sold out or seasonal' : 'nothing hidden'}
            muted={!hidden.totalDocs}
          />
          <Stat
            href={`${DISHES}?where[dealPrice][exists]=true`}
            label="On offer"
            value={deals.totalDocs}
            note={dealNote}
            accent={deals.totalDocs > 0}
            muted={!deals.totalDocs}
          />
          <Stat
            href={SETTINGS}
            label="Offer banner"
            value={banner.value}
            note={banner.note}
            accent={banner.value === 'On'}
            muted={banner.value === 'Off' || banner.value === 'Ended'}
          />
        </ul>
      </section>

      <section aria-labelledby="ab-do">
        <h2 id="ab-do" className="ab-dash__h2">
          Quick actions
        </h2>
        <ul className="ab-dash__actions">
          {online ? (
            <Action
              href={WEB_ORDERS}
              icon="bag"
              title="See today’s web orders"
              hint="Live list with a chime for each new paid order."
            />
          ) : null}
          <Action
            href={DISHES}
            icon="tag"
            title="Change a price"
            hint="Open the dish, type the new price, Publish changes."
          />
          <Action
            href={DISHES}
            icon="percent"
            title="Put a dish on offer"
            hint="Fill in its Deal price. Empty it to end the offer."
          />
          <Action
            href={DISHES}
            icon="eyeOff"
            title="Hide a sold-out dish"
            hint="Untick “On the menu”. Tick it to bring it back."
          />
          <Action
            href={SETTINGS}
            icon="megaphone"
            title="Announce an offer"
            hint="Site settings → Offer banner, with start and end dates."
          />
          <Action
            href={`${ADMIN}/globals/homepage`}
            icon="image"
            title="Change the home page"
            hint="Headline, photo, video and the signature dishes."
          />
          <Action
            href={`${ADMIN}/collections/users/create`}
            icon="userPlus"
            title="Add another admin"
            hint="Their email and a starting password; they can change it."
          />
        </ul>
      </section>

      <section aria-labelledby="ab-all">
        <h2 id="ab-all" className="ab-dash__h2">
          Everything else
        </h2>
        <div className="ab-dash__groups">
          <Group title="Menu">
            <Item href={DISHES} title="Dishes" text="Names, prices, deals, photos" create />
            <Item
              href={`${ADMIN}/collections/categories`}
              title="Menu sections"
              text="The headings on the menu and their order"
              create
            />
          </Group>
          <Group title="Website">
            <Item
              href={`${ADMIN}/globals/homepage`}
              title="Home page"
              text="Headline, photo, video"
            />
            <Item href={`${ADMIN}/globals/about`} title="About page" text="Our story" />
            <Item
              href={`${ADMIN}/collections/testimonials`}
              title="Reviews"
              text="Quotes from guests"
              create
            />
            <Item
              href={`${ADMIN}/collections/media`}
              title="Photos and videos"
              text="Everything uploaded"
              create
            />
            <Item href={SETTINGS} title="Site settings" text="Prices, banner, hours, links" />
          </Group>
          <Group title="Orders">
            <Item href={WEB_ORDERS} title="Web orders today" text="Live, with a chime" />
            <Item
              href={`${ADMIN}/collections/web-orders`}
              title="All web orders"
              text="Every pickup order from the website"
            />
          </Group>
          <Group title="Admin">
            <Item
              href={`${ADMIN}/collections/users`}
              title="Admins"
              text="Who can sign in here"
              create
            />
          </Group>
        </div>
      </section>
    </Gutter>
  )
}

function Stat({
  href,
  label,
  value,
  note,
  accent = false,
  muted = false,
}: {
  href: string
  label: string
  value: number | string
  note: string
  accent?: boolean
  muted?: boolean
}) {
  return (
    <li>
      <a
        href={href}
        className={`ab-dash__stat${accent ? ' is-accent' : ''}${muted ? ' is-muted' : ''}`}
      >
        <span className="ab-dash__stat-label">{label}</span>
        <span className="ab-dash__stat-value">{value}</span>
        <span className="ab-dash__stat-note">{note}</span>
      </a>
    </li>
  )
}

function Action({
  href,
  icon,
  title,
  hint,
}: {
  href: string
  icon: IconName
  title: string
  hint: string
}) {
  return (
    <li>
      <a href={href} className="ab-dash__action">
        <span className="ab-dash__action-icon">
          <Icon name={icon} />
        </span>
        <span>
          <span className="ab-dash__action-title">{title}</span>
          <span className="ab-dash__action-hint">{hint}</span>
        </span>
      </a>
    </li>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ab-dash__group">
      <h3 className="ab-dash__group-title">{title}</h3>
      <ul>{children}</ul>
    </div>
  )
}

function Item({
  href,
  title,
  text,
  create = false,
}: {
  href: string
  title: string
  text: string
  create?: boolean
}) {
  return (
    <li className="ab-dash__item">
      <a href={href} className="ab-dash__item-link">
        <span className="ab-dash__item-title">{title}</span>
        <span className="ab-dash__item-text">{text}</span>
      </a>
      {create ? (
        <a href={`${href}/create`} className="ab-dash__item-add" aria-label={`Add to ${title}`}>
          <Icon name="plus" />
        </a>
      ) : null}
    </li>
  )
}

const ICONS = {
  tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  percent: 'M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  eyeOff:
    'M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 9 5 9 7a9 9 0 0 1-2.3 3.3M6.3 6.3C4.2 7.8 3 10 3 12c0 2 4 7 9 7a9 9 0 0 0 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  megaphone: 'M3 10v4h3l7 4V6L6 10H3Zm13-1a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01',
  userPlus: 'M15 19c0-3-2.7-5-6-5s-6 2-6 5M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10-3v6m3-3h-6',
  plus: 'M12 5v14M5 12h14',
  bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  alert:
    'M12 9v4m0 4h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
} as const

type IconName = keyof typeof ICONS

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="ab-dash__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  )
}
