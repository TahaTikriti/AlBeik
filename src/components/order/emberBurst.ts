/**
 * A quick burst of sparks from an order button, where it was tapped, plus a
 * red ring off the button. Purely decorative and never delays the order: the
 * sheet opens (or the link navigates) at the same time. Skipped with reduced
 * motion.
 *
 * The sparks live in a manual popover so they sit in the top layer, above
 * the order sheet's backdrop when it opens on the same tap.
 */
const COLORS = ['#ffffff', '#fff1c4', '#ffb347', '#f4313f', '#d8262f']

export function emberBurst(target: HTMLElement, clientX = 0, clientY = 0) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rect = target.getBoundingClientRect()
  // Keyboard clicks report 0,0: burst from the button's middle instead.
  const x = clientX || rect.left + rect.width / 2
  const y = clientY || rect.top + rect.height / 2

  target.animate(
    [
      { boxShadow: '0 0 0 0 rgb(244 49 63 / 0.75)' },
      { boxShadow: '0 0 0 18px rgb(244 49 63 / 0)' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  )

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText = `position:fixed;inset:auto;left:${x}px;top:${y}px;width:0;height:0;margin:0;padding:0;border:0;background:none;overflow:visible;pointer-events:none;z-index:60`
  document.body.append(layer)
  if ('showPopover' in layer) {
    layer.popover = 'manual'
    layer.showPopover()
  }

  // A hot flash where the finger landed.
  const flash = document.createElement('span')
  flash.style.cssText =
    'position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;background:radial-gradient(closest-side,#fff 0,#ffd27a 30%,rgb(244 49 63 / 0.6) 60%,transparent)'
  layer.append(flash)
  flash.animate(
    [
      { transform: 'scale(0.2)', opacity: 1 },
      { transform: 'scale(1.4)', opacity: 0 },
    ],
    { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
  )

  for (let i = 0; i < 24; i++) {
    const spark = document.createElement('span')
    const size = 4 + Math.random() * 5
    const color = COLORS[i % COLORS.length]
    spark.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 ${size * 1.5}px ${size * 0.4}px ${color}`
    layer.append(spark)
    // Mostly upward, like sparks off a grill, then they fall a little.
    const angle = (-90 + (Math.random() - 0.5) * 240) * (Math.PI / 180)
    const distance = 50 + Math.random() * 80
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    spark.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${dx * 0.85}px, ${dy * 0.85}px) scale(0.85)`,
          opacity: 1,
          offset: 0.7,
        },
        { transform: `translate(${dx}px, ${dy + 26}px) scale(0.2)`, opacity: 0 },
      ],
      {
        duration: 560 + Math.random() * 340,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    )
  }

  // A timer, not Animation.finished: that settles in a rendering step, which
  // a background tab skips, and the layer would linger.
  setTimeout(() => layer.remove(), 1000)
}
