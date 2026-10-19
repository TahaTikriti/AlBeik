/**
 * A small puff of sparks from an order button, where it was tapped, plus a
 * soft red ring off the button. Kept small on purpose: a flourish, not
 * fireworks. Purely decorative and never delays the order: the
 * sheet opens (or the link navigates) at the same time. Skipped with reduced
 * motion.
 *
 * The sparks live in a manual popover so they sit in the top layer, above
 * the order sheet's backdrop when it opens on the same tap.
 */
const COLORS = ['#ffc160', '#ff8a3d', '#f4313f']

export function emberBurst(target: HTMLElement, clientX = 0, clientY = 0) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rect = target.getBoundingClientRect()
  // Keyboard clicks report 0,0: burst from the button's middle instead.
  const x = clientX || rect.left + rect.width / 2
  const y = clientY || rect.top + rect.height / 2

  target.animate(
    [
      { boxShadow: '0 0 0 0 rgb(244 49 63 / 0.45)' },
      { boxShadow: '0 0 0 10px rgb(244 49 63 / 0)' },
    ],
    { duration: 450, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  )

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText = `position:fixed;inset:auto;left:${x}px;top:${y}px;width:0;height:0;margin:0;padding:0;border:0;background:none;overflow:visible;pointer-events:none;z-index:60`
  document.body.append(layer)
  if ('showPopover' in layer) {
    layer.popover = 'manual'
    layer.showPopover()
  }

  for (let i = 0; i < 10; i++) {
    const spark = document.createElement('span')
    const size = 3 + Math.random() * 2
    const color = COLORS[i % COLORS.length]
    spark.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 ${size * 2}px ${color}`
    layer.append(spark)
    // Upward, like sparks off a grill, drifting down a touch at the end.
    const angle = (-90 + (Math.random() - 0.5) * 120) * (Math.PI / 180)
    const distance = 22 + Math.random() * 26
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    spark.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${dx * 0.75}px, ${dy * 0.75}px) scale(0.9)`,
          opacity: 1,
          offset: 0.5,
        },
        { transform: `translate(${dx}px, ${dy + 8}px) scale(0.3)`, opacity: 0 },
      ],
      {
        duration: 450 + Math.random() * 200,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    )
  }

  // A timer, not Animation.finished: that settles in a rendering step, which
  // a background tab skips, and the layer would linger.
  setTimeout(() => layer.remove(), 700)
}
