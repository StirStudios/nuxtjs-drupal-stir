import { createError } from 'h3'

export function buildParagraphPresentationPath(
  ceApiEndpoint: string,
  paragraphId: number,
): string {
  return `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/presentation`
}

export function createUpstreamParagraphPresentationError(error: unknown) {
  const upstreamStatus = Number(
    (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status,
  )

  return createError({
    statusCode: upstreamStatus >= 400 && upstreamStatus < 500
      ? upstreamStatus
      : 502,
    statusMessage: 'Failed to update paragraph presentation settings.',
  })
}
