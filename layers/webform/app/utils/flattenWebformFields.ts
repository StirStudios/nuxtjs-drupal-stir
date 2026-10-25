import type { WebformFieldProps, GroupField } from '#stir/types'

/** A Drupal Webform wizard page (`webform_wizard_page`) a field sits on. */
export interface WebformWizardPage {
  key: string
  title: string | null
  prevLabel: string | null
  nextLabel: string | null
}

interface FlattenedField extends WebformFieldProps {
  parent: string | null
  group?: string | null
  parentTitle?: string | null
  parentDescription?: string | null
  page?: WebformWizardPage | null
  // The Webform flexbox the field sits in; its fields render side by side.
  row?: string | null
}

const label = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

export function flattenWebformFields(
  fields: Record<string, WebformFieldProps>,
  parentKey: string | null = null,
  parentTitle: string | null = null,
  parentDescription: string | null = null,
  page: WebformWizardPage | null = null,
): Record<string, FlattenedField> {
  const flat: Record<string, FlattenedField> = {}

  for (const [key, field] of Object.entries(fields)) {
    if (!field || typeof field !== 'object') continue

    const type = field['#type']
    // Drupal puts the fields of any container under `children` with their
    // `#name`, so a container type this list does not know still groups.
    const isGroup = [
      'section',
      'fieldset',
      'details',
      'webform_section',
    ].includes(type) || 'children' in field

    const hasChildren =
      'children' in field ||
      Object.values(field).some(
        (v): v is WebformFieldProps =>
          typeof v === 'object' && v !== null && '#type' in v,
      )

    if (isGroup && hasChildren) {
      if (type === 'section') {
        flat[key] = {
          ...field,
          parent: parentKey,
          group: null,
          page,
        }
      }

      const children =
        'children' in field
          ? (field as GroupField).children!
          : (Object.fromEntries(
              Object.entries(field).filter(
                ([k, v]) =>
                  typeof v === 'object' &&
                  v !== null &&
                  '#type' in v &&
                  !k.startsWith('#'),
              ),
            ) as Record<string, WebformFieldProps>)

      // A wizard page is not a visual group: its fields keep their parent and
      // only learn which page they are on, so forms render as before until a
      // consumer pages through them.
      const childPage = type === 'webform_wizard_page'
        ? {
            key,
            title: label(field['#title']),
            prevLabel: label(field['#prevButtonLabel']),
            nextLabel: label(field['#nextButtonLabel']),
          }
        : page

      const nested = flattenWebformFields(
        children,
        type === 'section' ? key : parentKey,
        type === 'section' ? field['#title'] || null : parentTitle,
        type === 'section' ? field['#description'] || null : parentDescription,
        childPage,
      )

      if (type === 'webform_flexbox') {
        for (const child of Object.values(nested)) child.row ??= key
      }

      Object.assign(flat, nested)
    } else {
      flat[key] = {
        ...field,
        parent: parentKey,
        group: field['#group'] || null,
        parentTitle,
        parentDescription,
        page,
      }
    }
  }

  return flat
}
