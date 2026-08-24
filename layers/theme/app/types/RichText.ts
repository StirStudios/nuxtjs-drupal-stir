export interface FormattedTextEditTarget {
  entityType: string
  entityId: number | string
  fieldName: string
  editorMode?: 'formatted' | 'plain'
}

export interface EditableRichTextProps {
  id?: number | string
  uuid?: string
  parentUuid?: string
  text?: string
  textSource?: string
  classes?: string
  direction?: string
  editLink?: string
  editTarget?: unknown
}
