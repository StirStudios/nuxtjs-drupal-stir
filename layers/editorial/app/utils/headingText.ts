// Drupal's heading widget stores an optional HTML tag before the text.
export function headingTextForEditing(source: string): string {
  return source.replace(/^h[1-6]\|/, '')
}

export function headingTextForSave(source: string, text: string): string {
  const prefix = source.match(/^h[1-6]\|/)?.[0] || ''

  return text.trim() ? prefix + text : ''
}
