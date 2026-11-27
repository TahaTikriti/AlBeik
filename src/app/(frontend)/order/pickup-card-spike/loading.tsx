import { PickupProgress } from '@/components/order/PickupProgress'
import { ui } from '@/components/ui/classes'

export default function LoadingPickup() {
  return (
    <div data-page="pickup-spike" className={ui.container + ' grid gap-6 pt-8 pb-section sm:pt-14'}>
      <h1 className="text-display-1">Pickup</h1>
      <div className="w-full max-w-2xl rounded-card bg-surface-raised px-5 py-6 text-ink">
        <PickupProgress label="Loading pickup details…" />
      </div>
    </div>
  )
}
