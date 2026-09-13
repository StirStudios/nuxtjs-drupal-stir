// Drupal's heading widget stores an optional HTML tag before the text.
// Mirrors Drupal's HeadingValueParser::ALLOWED_TAGS (stir_layout_builder)
// and the theme layer's resolveHeadingTag(). Keep all three in sync:
// modules/stir_layout_builder/src/Helper/HeadingValueParser.php
const HEADING_TAG_PREFIX = /^(h2|h3|h4|div|span)\|/

export function headingTextForEditing(source: string): string {
  return source.replace(HEADING_TAG_PREFIX, '')
}

export function headingTextForSave(source: string, text: string): string {
  const prefix = source.match(HEADING_TAG_PREFIX)?.[0] || ''

  return text.trim() ? prefix + text : ''
}
