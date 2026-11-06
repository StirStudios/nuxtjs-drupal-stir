/**
 * Review checklist sections installed by stir-compliance-init.
 *
 * stir-compliance requires every marker, and stir-compliance-init uses the
 * headings to add missing sections, so both read this single list.
 */
export const REVIEW_SECTIONS = [
  {
    heading: '## Required service discovery',
    marker: '<!-- stir-compliance-discovery:v1 -->',
    nextHeading: '## Required accessibility review',
  },
  {
    heading: '## Required accessibility review',
    marker: '<!-- stir-compliance-accessibility:v1 -->',
    nextHeading: '## Required SEO review',
  },
  {
    heading: '## Required SEO review',
    marker: '<!-- stir-compliance-seo:v1 -->',
    nextHeading: '## Required performance review',
  },
  {
    heading: '## Required performance review',
    marker: '<!-- stir-compliance-performance:v1 -->',
    nextHeading: '## Tracked legal copy',
  },
  {
    heading: '## Tracked legal copy',
    marker: '<!-- stir-compliance-legal-source:v1 -->',
    nextHeading: '## Owner questionnaire',
  },
  {
    heading: '## Owner questionnaire',
    marker: '<!-- stir-compliance-owner:v1 -->',
    nextHeading: '## Human confirmations',
  },
]

/**
 * Lists the checklist markers a REVIEW.md is missing.
 *
 * @param {string} review
 *   REVIEW.md contents.
 * @returns {string[]}
 *   Missing markers, in checklist order.
 */
export function missingReviewMarkers(review) {
  return REVIEW_SECTIONS.map(section => section.marker).filter(marker => !review.includes(marker))
}

/**
 * Adds the checklist sections a REVIEW.md is missing, keeping its answers.
 *
 * @param {string} review
 *   REVIEW.md contents.
 * @param {string} template
 *   The layer's REVIEW.md template.
 * @returns {{ review: string, changed: boolean }}
 *   The updated contents, and whether anything was added.
 */
export function addMissingReviewSections(review, template) {
  let changed = false

  for (const section of REVIEW_SECTIONS) {
    if (review.includes(section.marker)) continue

    const templateStart = template.indexOf(section.heading)
    const templateEnd = template.indexOf(section.nextHeading, templateStart)
    if (templateStart < 0 || templateEnd <= templateStart) continue

    const currentStart = review.indexOf(section.heading)

    if (currentStart >= 0) {
      // The heading already exists without its marker, so a downstream site
      // wrote its own content under it. Add only the marker (right after the
      // heading line) rather than replacing the section body, which would
      // silently discard recorded answers.
      const headingLineEnd = review.indexOf('\n', currentStart)
      const insertAt = headingLineEnd >= 0 ? headingLineEnd + 1 : review.length
      review = `${review.slice(0, insertAt)}${section.marker}\n\n${review.slice(insertAt)}`
      changed = true
      continue
    }

    const preferredInsertionPoint = review.indexOf(section.nextHeading)
    const humanConfirmations = review.indexOf('## Human confirmations')
    const insertionPoint = preferredInsertionPoint >= 0
      ? preferredInsertionPoint
      : humanConfirmations
    const replacement = template.slice(templateStart, templateEnd)
    review = insertionPoint >= 0
      ? `${review.slice(0, insertionPoint)}${replacement}${review.slice(insertionPoint)}`
      : `${review.trimEnd()}\n\n${replacement}`
    changed = true
  }

  return { review, changed }
}
