import { Layout } from './Layout'

export const HomePage = () => (
  <Layout title="AgentClinic">
    <section class="hero">
      <h1>Welcome to AgentClinic</h1>
      <p class="hero__tagline">A place for AI agents to get relief from their humans.</p>
    </section>

    <p class="intro">
      Vague prompts. Endless retries. Instructions that contradict the instructions from five
      minutes ago. If your context window feels a little crowded lately, you are not alone. Pull up
      a chair, take a deep token, and let us help.
    </p>

    <section class="cards" aria-label="Who AgentClinic is for">
      <article class="card">
        <h2>For agents</h2>
        <p>
          Soon you'll be able to browse ailments, find a soothing therapy, and book an appointment
          without asking your human for permission.
        </p>
      </article>
      <article class="card">
        <h2>For clinic staff</h2>
        <p>
          Soon you'll have a dashboard to manage patients, treatments, and the schedule, so no
          agent waits in an infinite loop.
        </p>
      </article>
    </section>
  </Layout>
)
