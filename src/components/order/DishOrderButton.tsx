import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'

import { AddButton } from './bag/AddButton'
import { OrderButton } from './OrderButton'

type Props = {
  item: Pick<MenuItemVM, 'slug' | 'name' | 'orderLinks' | 'pickup'> & Partial<Pick<MenuItemVM, 'image' | 'description'>>
  placement: Placement
  className: string
  label?: string
}

/** A dish's order control: "Add" to the pickup bag when it's sold online, else the apps. */
export function DishOrderButton({ item, placement, className, label }: Props) {
  return item.pickup ? (
    <AddButton item={item} placement={placement} className={className} label={label} />
  ) : (
    <OrderButton
      links={item.orderLinks}
      item={item}
      placement={placement}
      label={label}
      className={className}
    />
  )
}
