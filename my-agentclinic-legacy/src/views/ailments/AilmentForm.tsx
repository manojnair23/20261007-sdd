import { DESCRIPTION_MAX, NAME_MAX, type AilmentErrors, type AilmentFormValues } from '../../ailments/validate'
import { ErrorSummary, PageHeader } from '../components'
import { TextArea, TextField } from '../forms'
import { Layout, pageTitle } from '../Layout'

type AilmentFormProps = {
  title: string
  lead: string
  /** Where the form posts, which is also the page's own path. */
  action: string
  submitLabel: string
  /** Where "Cancel" goes. */
  cancelHref: string
  values: AilmentFormValues
  errors?: AilmentErrors
}

/** The form to add or edit an ailment. */
export const AilmentForm = ({
  title,
  lead,
  action,
  submitLabel,
  cancelHref,
  values,
  errors = {},
}: AilmentFormProps) => (
  <Layout title={pageTitle(title)} path={action}>
    <PageHeader title={title} lead={lead} />
    <ErrorSummary errors={errors} />
    <form method="post" action={action} novalidate class="narrow">
      <TextField id="name" label="Name" value={values.name} error={errors.name} maxlength={NAME_MAX} />
      <TextArea
        id="description"
        label="Description"
        value={values.description}
        error={errors.description}
        maxlength={DESCRIPTION_MAX}
        hint={`How it feels, from the agent's side. Up to ${DESCRIPTION_MAX} characters.`}
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
