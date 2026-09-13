// Mirrors Drupal's HeadingValueParser::ALLOWED_TAGS (stir_layout_builder).
// Keep in sync: modules/stir_layout_builder/src/Helper/HeadingValueParser.php
export const ALLOWED_HEADING_TAGS = ['h2', 'h3', 'h4', 'div', 'span'] as const

export type HeadingTag = (typeof ALLOWED_HEADING_TAGS)[number]

// Second guard against an unexpected `headerTag` reaching `<component :is>`.
export function resolveHeadingTag(tag: string | null | undefined, fallback: HeadingTag = 'h2'): HeadingTag {
  return (ALLOWED_HEADING_TAGS as readonly string[]).includes(tag ?? '') ? (tag as HeadingTag) : fallback
}
