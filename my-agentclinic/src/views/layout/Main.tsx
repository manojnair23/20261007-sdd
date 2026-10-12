import type { Child } from 'hono/jsx'

type MainProps = {
  children?: Child
}

// id="main" is the skip link's target; tabindex lets browsers move focus there.
export const Main = ({ children }: MainProps) => (
  <main id="main" class="container" tabindex={-1}>
    {children}
  </main>
)
