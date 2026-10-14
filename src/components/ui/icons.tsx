/** Minimal stroke icons for the tab bar and buttons (inherit color and size). */
type Props = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const HomeIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
)

export const MenuIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 4v7a3 3 0 0 0 6 0V4M7 4v17M17 4c-2 0-3 2.5-3 6s1.5 4 3 4v7" />
  </svg>
)

export const StoryIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

export const PinIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

export const BagIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)

export const ArrowIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const BackIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
)

export const CloseIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const PlusIcon = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
