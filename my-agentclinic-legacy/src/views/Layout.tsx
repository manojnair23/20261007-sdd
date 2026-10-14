import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { Main } from './layout/Main'

type LayoutProps = {
  title: string
  /** The request path, used to mark the current nav link. */
  path?: string
  children?: Child
}

export const Layout = ({ title, path, children }: LayoutProps) => (
  <>
    {raw('<!doctype html>')}
    <html lang="en" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/pico.min.css" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <Header path={path} />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  </>
)

/** Page title in the "Agents · AgentClinic" form. */
export const pageTitle = (name: string) => `${name} · AgentClinic`
