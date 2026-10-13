import type { TextField } from 'payload'

import { isAllowedOrderUrl, PLATFORMS, type PlatformId } from '@/lib/order'

/** An optional DoorDash / Uber Eats link, validated by the same rule the site renders with. */
export function orderUrlField(args: {
  name: string
  label: string
  platform: PlatformId
  description: string
}): TextField {
  const platform = PLATFORMS.find((p) => p.id === args.platform)!
  return {
    name: args.name,
    label: args.label,
    type: 'text',
    admin: { description: args.description },
    validate: (value: string | null | undefined) => {
      if (!value?.trim()) return true
      return (
        isAllowedOrderUrl(args.platform, value) ||
        `Paste an https link from ${platform.label} (${platform.hosts.join(' or ')}).`
      )
    },
  }
}
