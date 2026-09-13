import type { EditableRichTextProps } from '../types/RichText'

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

/**
 * Maps Drupal text paragraph props onto EditableRichText props. The payload's
 * `textEdit` target is used when no explicit `editTarget` is set.
 */
export function toEditableRichTextProps(
  props: object,
  classes?: string,
): EditableRichTextProps {
  const source = props as Record<string, unknown>
  const id = source.id

  return {
    id: typeof id === 'string' || typeof id === 'number' ? id : undefined,
    uuid: optionalString(source.uuid),
    parentUuid: optionalString(source.parentUuid),
    text: optionalString(source.text),
    textSource: optionalString(source.textSource),
    classes: classes ?? optionalString(source.classes),
    direction: optionalString(source.direction),
    editLink: optionalString(source.editLink),
    editTarget: source.editTarget ?? source.textEdit,
  }
}
