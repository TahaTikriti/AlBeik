import Image from 'next/image'

import type { ImageVM } from '@/lib/data/types'

/**
 * Brand slots. Views place these; each design direction decides what they
 * are (mustache divider, fez loader, smoke…). On `main` they're plain.
 */

export function Logo({ name, image }: { name: string; image: ImageVM | null }) {
  if (image) {
    return <Image src={image.url} alt={name} width={image.width} height={image.height} priority />
  }
  return <span>{name}</span>
}

export function Divider() {
  return <hr />
}

export function Loader() {
  return null
}

export function NotFoundArt() {
  return null
}
