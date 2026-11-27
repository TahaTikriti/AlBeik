export function PickupProgress({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-small" role="status">
      <span
        aria-hidden
        className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
      />
      {label}
    </span>
  )
}
