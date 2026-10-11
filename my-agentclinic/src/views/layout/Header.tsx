export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Agents' },
  { href: '/ailments', label: 'Ailments' },
  { href: '/therapies', label: 'Therapies' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/dashboard', label: 'Dashboard' },
] as const

/** `page` for the link to this exact page, `true` for its section (e.g. an agent's detail page). */
export function currentFor(href: string, path: string): 'page' | 'true' | undefined {
  if (path === href) return 'page'
  if (href !== '/' && path.startsWith(`${href}/`)) return 'true'
  return undefined
}

type HeaderProps = {
  path?: string
}

export const Header = ({ path = '' }: HeaderProps) => (
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="site-name" href="/">
        AgentClinic
      </a>
      <nav aria-label="Main">
        <ul>
          {NAV_LINKS.map(({ href, label }) => (
            <li>
              <a href={href} aria-current={currentFor(href, path)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
)
