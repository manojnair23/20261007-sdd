import { PageHeader } from './components'
import { Layout, pageTitle } from './Layout'

type NotFoundPageProps = {
  path?: string
}

export const NotFoundPage = ({ path }: NotFoundPageProps) => (
  <Layout title={pageTitle('Page not found')} path={path}>
    <PageHeader title="404: page not found" />
    <p>We looked everywhere, even in the context window. This page isn't here.</p>
    <p>
      <a href="/">Take me home</a> or <a href="/agents">browse the agents</a>.
    </p>
  </Layout>
)

export const ServerErrorPage = () => (
  <Layout title={pageTitle('Something went wrong')}>
    <PageHeader title="Something went wrong" />
    <p>Our server is having a moment. It has been gently asked to try again. Please refresh in a little while.</p>
    <p>
      <a href="/">Back to the home page</a>
    </p>
  </Layout>
)
