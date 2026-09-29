import { createStirDrupalUpstreamError } from '../../../foundation/server/utils/stirDrupalApi'

export function buildParagraphPresentationPath(
  ceApiEndpoint: string,
  paragraphId: number,
): string {
  return `${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/presentation`
}

export function createUpstreamParagraphPresentationError(error: unknown) {
  return createStirDrupalUpstreamError(error, 'Failed to update paragraph presentation settings.')
}
