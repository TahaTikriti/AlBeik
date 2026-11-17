/**
 * The admin's home page opens with the things the restaurant does most,
 * in plain words, above Payload's list of sections.
 */
const tasks: { title: string; steps: string; href: string }[] = [
  {
    title: 'Change a price',
    steps: 'Open the dish, type the new price, press Publish changes.',
    href: '/admin/collections/menu-items',
  },
  {
    title: 'Put a dish on offer',
    steps: 'Fill in its Deal price: the old price shows crossed out. Empty it to end the offer.',
    href: '/admin/collections/menu-items',
  },
  {
    title: 'Sold out or seasonal',
    steps: 'Untick "On the menu" on the dish. Tick it again to bring it back.',
    href: '/admin/collections/menu-items',
  },
  {
    title: 'Announce an offer',
    steps: 'Site settings → Offer banner: a red strip on every page, with start and end dates.',
    href: '/admin/globals/site-settings',
  },
  {
    title: 'Add another admin',
    steps:
      'Type their email and a starting password, then send them both. They can change it later.',
    href: '/admin/collections/users/create',
  },
]

export function Welcome() {
  return (
    <section style={{ marginBottom: 'calc(var(--base) * 2)' }}>
      <h2 style={{ margin: '0 0 calc(var(--base) * 0.25)' }}>Welcome to the AlBeik admin</h2>
      <p style={{ margin: '0 0 var(--base)', color: 'var(--theme-elevation-500)' }}>
        Changes are on the website as soon as you press <strong>Publish changes</strong>.
      </p>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
          gap: 'calc(var(--base) * 0.75)',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {tasks.map((task) => (
          <li key={task.title}>
            <a
              href={task.href}
              style={{
                display: 'block',
                height: '100%',
                padding: 'var(--base)',
                borderRadius: 'var(--style-radius-m)',
                border: '1px solid var(--theme-elevation-150)',
                background: 'var(--theme-elevation-50)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.35em', color: '#d8262f' }}>
                {task.title}
              </strong>
              <span style={{ color: 'var(--theme-elevation-800)' }}>{task.steps}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
