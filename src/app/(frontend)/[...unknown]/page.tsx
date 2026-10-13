import { notFound } from 'next/navigation'

/**
 * Unknown URLs render the site's own 404 (inside the frontend layout) instead
 * of Next's default page. global-not-found is still experimental in Next 16.
 */
export default function UnknownPage() {
  notFound()
}
