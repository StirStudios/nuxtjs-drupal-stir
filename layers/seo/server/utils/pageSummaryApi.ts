import { array, maxLength, nullable, parse, pipe, startsWith, strictObject, string } from 'valibot'
import type { H3Event } from 'h3'
import type { PageSummary } from '../../shared/types/pageSummary'
import { stirDrupalApiRequest } from '../../../foundation/server/utils/stirDrupalApi'

export const PAGE_SUMMARY_BATCH = 25

const pageSummarySchema = pipe(array(strictObject({
  path: pipe(string(), startsWith('/')),
  title: string(),
  description: nullable(string()),
})), maxLength(PAGE_SUMMARY_BATCH))

export const parsePageSummaries = (value: unknown): PageSummary[] => parse(pageSummarySchema, value)

// Drupal answers 25 paths per request; a Drupal without the endpoint gives none.
export async function fetchPageSummaries(event: H3Event, paths: string[]): Promise<PageSummary[]> {
  const unique = [...new Set(paths)]
  const batches = Array.from(
    { length: Math.ceil(unique.length / PAGE_SUMMARY_BATCH) },
    (_, index) => unique.slice(index * PAGE_SUMMARY_BATCH, (index + 1) * PAGE_SUMMARY_BATCH),
  )
  const results = await Promise.all(batches.map(batch =>
    stirDrupalApiRequest<unknown>(
      event,
      `/api/seo/summaries?${new URLSearchParams(batch.map(path => ['path[]', path]))}`,
      { method: 'GET' },
    )
      .then(parsePageSummaries)
      .catch(() => []),
  ))

  return results.flat()
}
