import type { WebformConditionGroup, WebformFieldProps, WebformState } from '#stir/types'
import type { WebformWizardPage } from '#stir-webform/utils/flattenWebformFields'
import { resolveWebformFieldStates } from '#stir-webform/utils/webformConditions'
import { isWebformDisplayElement } from '#stir-webform/utils/webformDisplayUtils'

type PagedField = WebformFieldProps & { page?: WebformWizardPage | null }

/**
 * The wizard pages a visitor steps through, in form order. A page counts while
 * any of its fields is visible, so `#states` on a page (inherited by its
 * fields) skip it. Empty for a form without wizard pages.
 */
export function resolveWizardPages(
  fields: Record<string, PagedField>,
  orderedFieldNames: string[],
  state: WebformState,
): WebformWizardPage[] {
  const pages = new Map<string, WebformWizardPage>()

  for (const fieldName of orderedFieldNames) {
    const field = fields[fieldName]
    const page = field?.page

    if (!field || !page || pages.has(page.key)) continue
    if (resolveWebformFieldStates(field, state).visible) pages.set(page.key, page)
  }

  return [...pages.values()]
}

/** Field names on one wizard page, in form order. */
export function wizardPageFieldNames(
  fields: Record<string, PagedField>,
  orderedFieldNames: string[],
  pageKey: string | undefined,
): string[] {
  return orderedFieldNames.filter((fieldName) => fields[fieldName]?.page?.key === pageKey)
}

/**
 * Whether a wizard page comes after this one. A later page counts while it is
 * visible, or while none of the answers its `#states` depend on is given: a
 * page hidden until a path is chosen still comes later, so the chooser offers
 * Next, but once the other path is chosen the last page offers Submit.
 */
export function hasLaterWizardPage(
  fields: Record<string, PagedField>,
  orderedFieldNames: string[],
  pageKey: string | undefined,
  state: WebformState,
): boolean {
  const keys = [...new Set(orderedFieldNames.map((fieldName) => fields[fieldName]?.page?.key).filter(Boolean))]
  const index = pageKey ? keys.indexOf(pageKey) : -1

  if (index < 0) return false

  return keys.slice(index + 1).some((key) =>
    wizardPageFieldNames(fields, orderedFieldNames, key).some((fieldName) => {
      const field = fields[fieldName]!

      const inputs = statesInputNames(field)

      return resolveWebformFieldStates(field, state).visible || (inputs.length > 0 && inputs.every((name) => isEmptyAnswer(state[name])))
    }),
  )
}

/**
 * The inputs a field's conditions depend on, by Drupal machine name. Read from
 * `#conditions`: Custom Elements camel-cases the `#states` selectors.
 */
function statesInputNames(field: PagedField): string[] {
  const names = (group: WebformConditionGroup): string[] =>
    group.rules.flatMap((rule) => 'rules' in rule ? names(rule) : rule.name ? [rule.name] : [])

  return [...new Set((field['#conditions'] ?? []).flatMap(names))]
}

function isEmptyAnswer(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

/**
 * The field a page's answer is chosen with, when the page asks only one
 * radio question (a path chooser). Picking an option then moves on, saving a
 * click. Display-only elements on the page (text, links) do not count.
 */
export function wizardChoiceField(
  fields: Record<string, PagedField>,
  orderedFieldNames: string[],
  pageKey: string | undefined,
): string | undefined {
  const inputs = wizardPageFieldNames(fields, orderedFieldNames, pageKey)
    .filter((fieldName) => fields[fieldName] && !isWebformDisplayElement(fields[fieldName]!))

  return inputs.length === 1 && fields[inputs[0]!]?.['#type'] === 'radio' ? inputs[0] : undefined
}
