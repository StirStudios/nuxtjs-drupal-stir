import type { WebformFieldProps, WebformState } from '#stir/types'
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
 * Whether the form declares a wizard page after this one, visible or not. A
 * page hidden until an earlier answer (a path chooser) still comes later, so
 * the current page offers Next, not Submit.
 */
export function hasLaterWizardPage(
  fields: Record<string, PagedField>,
  orderedFieldNames: string[],
  pageKey: string | undefined,
): boolean {
  const keys = [...new Set(orderedFieldNames.map((fieldName) => fields[fieldName]?.page?.key).filter(Boolean))]
  const index = pageKey ? keys.indexOf(pageKey) : -1

  return index >= 0 && index < keys.length - 1
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
