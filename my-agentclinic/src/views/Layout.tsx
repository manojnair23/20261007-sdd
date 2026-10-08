import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'

type LayoutProps = {
  title: string
  children?: Child
}

export const Layout = ({ title, children }: LayoutProps) => (
  <>
    {raw('<!doctype html>')}
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <header class="site-header">
          <div class="container site-header__inner">
            <a class="site-name" href="/">
              AgentClinic
            </a>
            <nav aria-label="Main">
              <ul class="nav-list">
                <li>
                  <a href="/">Home</a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main class="container">{children}</main>
        <footer class="site-footer">
          <div class="container">
            <p>No agents were over-prompted in the making of this site.</p>
          </div>
        </footer>
      </body>
    </html>
  </>
)
