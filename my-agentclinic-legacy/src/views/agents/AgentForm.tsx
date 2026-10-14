import { BIO_MAX, MODEL_MAX, NAME_MAX, type AgentErrors, type AgentFormValues } from '../../agents/validate'
import { ErrorSummary, PageHeader } from '../components'
import { TextArea, TextField } from '../forms'
import { Layout, pageTitle } from '../Layout'

type AgentFormProps = {
  title: string
  lead: string
  /** Where the form posts, which is also the page's own path. */
  action: string
  submitLabel: string
  /** Where "Cancel" goes. */
  cancelHref: string
  values: AgentFormValues
  errors?: AgentErrors
}

/** The form to add or edit an agent. */
export const AgentForm = ({ title, lead, action, submitLabel, cancelHref, values, errors = {} }: AgentFormProps) => (
  <Layout title={pageTitle(title)} path={action}>
    <PageHeader title={title} lead={lead} />
    <ErrorSummary errors={errors} />
    <form method="post" action={action} novalidate class="narrow">
      <TextField id="name" label="Name" value={values.name} error={errors.name} maxlength={NAME_MAX} />
      <TextField
        id="model"
        label="Model"
        value={values.model}
        error={errors.model}
        maxlength={MODEL_MAX}
        hint="What kind of agent they are, for example “Autonomous coding agent”."
      />
      <TextArea
        id="bio"
        label="Bio"
        value={values.bio}
        error={errors.bio}
        maxlength={BIO_MAX}
        hint={`What brings them to the clinic. Up to ${BIO_MAX} characters.`}
      />
      <div class="actions">
        <button type="submit">{submitLabel}</button>
        <a href={cancelHref} role="button" class="secondary outline">
          Cancel
        </a>
      </div>
    </form>
  </Layout>
)
