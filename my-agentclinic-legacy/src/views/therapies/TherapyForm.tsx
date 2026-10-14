import {
  DESCRIPTION_MAX,
  DURATION_MAX,
  DURATION_MIN,
  NAME_MAX,
  type TherapyErrors,
  type TherapyFormValues,
} from '../../therapies/validate'
import { ErrorSummary, PageHeader } from '../components'
import { NumberField, TextArea, TextField } from '../forms'
import { Layout, pageTitle } from '../Layout'

type TherapyFormProps = {
  title: string
  lead: string
  /** Where the form posts, which is also the page's own path. */
  action: string
  submitLabel: string
  values: TherapyFormValues
  errors?: TherapyErrors
}

/** The form to add or edit a therapy. "Cancel" goes back to the therapies page, as therapies have no page of their own. */
export const TherapyForm = ({ title, lead, action, submitLabel, values, errors = {} }: TherapyFormProps) => (
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
        hint={`What happens in the session. Up to ${DESCRIPTION_MAX} characters.`}
      />
      <NumberField
        id="durationMinutes"
        label="Duration (minutes)"
        value={values.durationMinutes}
        error={errors.durationMinutes}
        min={DURATION_MIN}
        max={DURATION_MAX}
        hint={`A whole number of minutes, up to ${DURATION_MAX} (a full clinic day).`}
      />
      <div class="actions">
        <button type="submit">{submitLabel}</button>
        <a href="/therapies" role="button" class="secondary outline">
          Cancel
        </a>
      </div>
    </form>
  </Layout>
)
