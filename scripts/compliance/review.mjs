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
