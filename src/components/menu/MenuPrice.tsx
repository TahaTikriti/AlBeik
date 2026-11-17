import type { MenuItemVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

type PriceProps = { price: number; dealPrice?: number | null }

/** A price, or a deal: the old price crossed out before the new one in red. */
export function Price({ price, dealPrice = null }: PriceProps) {
  if (dealPrice === null) return <>{formatPrice(price)}</>
  return (
    <span className="inline-flex items-baseline gap-[0.3em]">
      <span className="sr-only">{copy.menu.was}</span>
      <s className="text-[0.7em] text-ink-muted decoration-red decoration-2">
        {formatPrice(price)}
      </s>
      <span className="sr-only">{copy.menu.now}</span>
      <span className="text-red-text">{formatPrice(dealPrice)}</span>
    </span>
  )
}

type Props = { item: MenuItemVM; className?: string }

/**
 * A dish's price on a menu card or row: the price (or deal), then the combo
 * and any other sizes as small lines under it. Nothing when prices are off.
 */
export function MenuPrice({ item, className = '' }: Props) {
  if (item.price === null) return null
  const extras = [
    ...(item.comboPrice !== null ? [copy.menu.comboPrice(formatPrice(item.comboPrice))] : []),
    ...item.sizes.map((size) => `${size.label} ${formatPrice(size.price)}`),
  ]
  return (
    <span className={`grid font-display text-[1.2rem] leading-none sm:text-2xl ${className}`}>
      <Price price={item.price} dealPrice={item.dealPrice} />
      {extras.map((line, i) => (
        <span
          key={i}
          className="mt-1 text-[0.7rem] tracking-[0.06em] text-ink-muted uppercase sm:text-[0.8rem]"
        >
          {line}
        </span>
      ))}
    </span>
  )
}
