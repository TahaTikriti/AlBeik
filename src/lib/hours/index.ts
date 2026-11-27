export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]

export type HoursRow = {
  days?: Day[] | null
  opens?: string | null
  closes?: string | null
}

export type HoursLine = { days: string; time: string }

const DAY_LABELS: Record<Day, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

const SCHEMA_DAYS: Record<Day, string> = {
  mon: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** 24-hour "HH:MM", the format the CMS stores. */
export function isValidTime(value: string | null | undefined): value is string {
  return !!value && TIME.test(value)
}

export function formatTime(value: string): string {
  const [h = 0, m = 0] = value.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "Mon–Thu", "Fri, Sat", "Every day". Weeks start on Monday. */
export function formatDays(days: Day[]): string {
  const sorted = DAYS.filter((d) => days.includes(d))
  if (sorted.length === DAYS.length) return 'Every day'

  const runs: Day[][] = []
  for (const day of sorted) {
    const run = runs.at(-1)
    const prev = run?.at(-1)
    if (run && prev && DAYS.indexOf(day) === DAYS.indexOf(prev) + 1) run.push(day)
    else runs.push([day])
  }

  return runs
    .map((run) =>
      run.length >= 3
        ? `${DAY_LABELS[run[0]!]}–${DAY_LABELS[run.at(-1)!]}`
        : run.map((d) => DAY_LABELS[d]).join(', '),
    )
    .join(', ')
}

export function formatHours(rows: HoursRow[] | null | undefined): HoursLine[] {
  return completeHours(rows).map((row) => ({
    days: formatDays(row.days),
    time: `${formatTime(row.opens)} – ${formatTime(row.closes)}`,
  }))
}

export function toSchemaOpeningHours(rows: HoursRow[] | null | undefined) {
  return completeHours(rows).map((row) => ({
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: row.days.map((d) => SCHEMA_DAYS[d]),
    opens: row.opens,
    closes: row.closes,
  }))
}

export type OpeningHours = { days: Day[]; opens: string; closes: string }

/** Valid rows only, days in week order, without CMS bookkeeping fields. */
export function completeHours(rows: HoursRow[] | null | undefined): OpeningHours[] {
  return (rows ?? []).flatMap((row) =>
    row.days?.length && isValidTime(row.opens) && isValidTime(row.closes)
      ? [{ days: DAYS.filter((d) => row.days!.includes(d)), opens: row.opens, closes: row.closes }]
      : [],
  )
}

/** Wall-clock parts of an instant in a time zone. */
function zonedParts(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(at)
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
  return parts
}

/** The instant a wall-clock time happens in a time zone (DST-safe for whole minutes). */
function zonedInstant(year: number, month: number, day: number, hhmm: string, timeZone: string) {
  const [hh, mm] = hhmm.split(':').map(Number) as [number, number]
  const guess = Date.UTC(year, month - 1, day, hh, mm)
  const offset = (at: number) => {
    const p = zonedParts(new Date(at), timeZone)
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - at
  }
  const first = guess - offset(guess)
  return new Date(guess - offset(first))
}

export type PickupWindow = { open: true; lastOrderAt: Date } | { open: false; opensAt: Date | null }

/**
 * Whether the restaurant takes a pickup order now: from opening until
 * closing minus the prep time. A closing time at or before opening (2:00 AM)
 * belongs to the day the shift started.
 */
export function pickupWindow(
  hours: OpeningHours[],
  timeZone: string,
  prepMinutes: number,
  now: Date,
): PickupWindow {
  const today = zonedParts(now, timeZone)
  const base = Date.UTC(today.year, today.month - 1, today.day)
  let opensAt: Date | null = null
  // Yesterday (for after-midnight closings) through a week ahead.
  for (let offset = -1; offset <= 7; offset++) {
    const date = new Date(base + offset * 86_400_000)
    const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    const day = DAYS[(date.getUTCDay() + 6) % 7]!
    for (const row of hours) {
      if (!row.days.includes(day)) continue
      const openAt = zonedInstant(y, m, d, row.opens, timeZone)
      const nextDay = row.closes <= row.opens ? new Date(Date.UTC(y, m - 1, d + 1)) : date
      const closeAt = zonedInstant(
        nextDay.getUTCFullYear(),
        nextDay.getUTCMonth() + 1,
        nextDay.getUTCDate(),
        row.closes,
        timeZone,
      )
      const lastOrderAt = new Date(closeAt.getTime() - prepMinutes * 60_000)
      if (now >= openAt && now <= lastOrderAt) return { open: true, lastOrderAt }
      if (openAt > now && (!opensAt || openAt < opensAt)) opensAt = openAt
    }
  }
  return { open: false, opensAt }
}

/** Midnight at the start of `now`'s date in `timeZone` (for "today's orders"). */
export function startOfDay(timeZone: string, now: Date = new Date()): Date {
  const p = zonedParts(now, timeZone)
  return zonedInstant(p.year, p.month, p.day, '00:00', timeZone)
}
