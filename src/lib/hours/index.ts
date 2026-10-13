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
