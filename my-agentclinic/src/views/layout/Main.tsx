import type { Child } from 'hono/jsx'

type MainProps = {
  children?: Child
}

export const Main = ({ children }: MainProps) => <main class="container">{children}</main>
