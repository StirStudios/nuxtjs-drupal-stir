import type { WebformFieldProps, GroupField } from '~/types'

interface FlattenedField extends WebformFieldProps {
  parent: string | null
  group?: string | null
  parentTitle?: string | null
  parentDescription?: string | null
}

export function flattenWebformFields(
  fields: Record<string, WebformFieldProps>,
  parentKey: string | null = null,
  parentTitle: string | null = null,
  parentDescription: string | null = null,
): Record<string, FlattenedField> {
  const flat: Record<string, FlattenedField> = {}

  for (const [key, field] of Object.entries(fields)) {
    if (!field || typeof field !== 'object') continue

    const type = field['#type']
    const isGroup = [
      'section',
      'fieldset',
      'details',
      'webform_section',
    ].includes(type)

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

      const nested = flattenWebformFields(
        children,
        type === 'section' ? key : parentKey,
        type === 'section' ? field['#title'] || null : parentTitle,
        type === 'section' ? field['#description'] || null : parentDescription,
      )

      Object.assign(flat, nested)
    } else {
      flat[key] = {
        ...field,
        parent: parentKey,
        group: field['#group'] || null,
        parentTitle,
        parentDescription,
      }
    }
  }

  return flat
}
