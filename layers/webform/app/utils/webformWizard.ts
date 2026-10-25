import type { WebformFieldProps, WebformState } from '#stir/types'
import type { WebformWizardPage } from '#stir-webform/utils/flattenWebformFields'
import { resolveWebformFieldStates } from '#stir-webform/utils/webformConditions'

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
