export type FaqSchemaItem = {
  question: string
  answerHtml: string
}

export type BreadcrumbSchemaItem = {
  label: string
  url?: string
}

export function buildFaqPageSchema(items: FaqSchemaItem[]) {
  const mainEntity = items
    .filter(item => item.question && item.answerHtml)
    .map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answerHtml,
      },
    }))

  if (mainEntity.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}

export function buildBreadcrumbListSchema(
  items: BreadcrumbSchemaItem[],
  origin: string,
  currentUrl: string,
) {
  if (items.length < 2) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.url ? new URL(item.url, origin).href : currentUrl,
    })),
  }
}
