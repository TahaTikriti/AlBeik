'use client'

import { useEffect, useRef, useState } from 'react'

import type { CategoryRef } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'

/**
 * Category chips that stick under the header. Plain anchor links (work
 * without JS); JS only highlights the chip for the section in view and
 * keeps it scrolled into the chip bar.
 */
export function CategoryNav({ categories }: { categories: CategoryRef[] }) {
  const [active, setActive] = useState(categories[0]?.slug)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        const first = categories.find((c) => visible.get(c.slug))
        if (first) setActive(first.slug)
      },
      // A band near the top of the viewport, below the sticky bars.
      { rootMargin: '-25% 0px -65% 0px' },
    )
    for (const { slug } of categories) {
      const section = document.getElementById(slug)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    const list = listRef.current
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`)
    if (!list || !chip) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.clientWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [active])

  return (
    <nav
      aria-label={copy.menu.categoriesLabel}
      className="sticky top-header z-(--z-sticky) border-b border-line bg-surface"
    >
      <ul
        ref={listRef}
        className={`${ui.container} flex h-chipbar items-center gap-2 overflow-x-auto [scrollbar-width:none]`}
      >
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <a
              href={`#${category.slug}`}
              data-slug={category.slug}
              aria-current={active === category.slug ? 'true' : undefined}
              className={`${ui.chip} aria-[current=true]:bg-accent aria-[current=true]:text-accent-ink`}
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
