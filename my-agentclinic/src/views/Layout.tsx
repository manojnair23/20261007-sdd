import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { Main } from './layout/Main'

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
        <Header />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  </>
)
