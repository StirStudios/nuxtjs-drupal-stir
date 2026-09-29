import { createError } from 'h3'
import {
  createStirDrupalUpstreamError,
  getStirDrupalStatusCode,
} from '../../../foundation/server/utils/stirDrupalApi'

export function parseParagraphId(value: unknown): number {
  const paragraphId = Number(value)

  if (!Number.isInteger(paragraphId) || paragraphId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid paragraph id.',
    })
  }

  return paragraphId
}

export function buildParagraphTextPath(ceApiEndpoint: string, paragraphId: number): string {
  return `${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/text`
}

export function createUpstreamParagraphTextError(error: unknown, fallbackMessage: string) {
  return createStirDrupalUpstreamError(
    error,
    getStirDrupalStatusCode(error) === 409
      ? 'This content has changed or requires editing in Drupal. Reload before trying again.'
      : fallbackMessage,
  )
}

export function parseTextValue(value: unknown): string {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Text is required.' })
  }
  return value
}
