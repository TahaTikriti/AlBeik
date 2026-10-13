/** Shared class strings for the neutral `main` look. POCs restyle freely. */
export const ui = {
  container: 'mx-auto w-full max-w-content px-gutter',
  section: 'py-section',
  buttonPrimary:
    'inline-flex min-h-tap items-center justify-center gap-2 rounded-control bg-accent px-5 font-semibold text-accent-ink',
  buttonSecondary:
    'inline-flex min-h-tap items-center justify-center gap-2 rounded-control border border-line px-5 font-semibold',
  link: 'underline underline-offset-4',
  chip: 'inline-flex min-h-tap items-center rounded-control border border-line px-4 text-small',
  tag: 'inline-flex items-center rounded-control border border-line px-2 py-0.5 text-label',
} as const
