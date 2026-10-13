import type { Child } from 'hono/jsx'
import { PageHeader } from './components'
import { Layout, pageTitle } from './Layout'

type ConfirmDeletePageProps = {
  /** The record's name, as staff know it. */
  name: string
  /** Where the form posts, which is also the page's own path. */
  action: string
  /** Where "Keep it" goes. */
  cancelHref: string
  /** What else goes with the record, and what stays. */
  children: Child
}

/** Asks before deleting. Deleting only happens on the POST, so a stray link can't remove anything. */
export const ConfirmDeletePage = ({ name, action, cancelHref, children }: ConfirmDeletePageProps) => (
  <Layout title={pageTitle(`Delete ${name}?`)} path={action}>
    <PageHeader title={`Delete ${name}?`} lead="This can't be undone." />
    {children}
    <form method="post" action={action} class="actions">
      <button type="submit" class="secondary">
        Delete {name}
      </button>
      <a href={cancelHref} role="button" class="secondary outline">
        Keep it
      </a>
    </form>
  </Layout>
)

type CannotDeletePageProps = {
  name: string
  /** The page's own path, for the nav. */
  path: string
  /** Why it can't go, and where to look instead. */
  children: Child
}

/** Shown with 409 when a record can't be deleted. */
export const CannotDeletePage = ({ name, path, children }: CannotDeletePageProps) => (
  <Layout title={pageTitle(`${name} can't be deleted`)} path={path}>
    <PageHeader title={`${name} can't be deleted`} />
    {children}
  </Layout>
)
