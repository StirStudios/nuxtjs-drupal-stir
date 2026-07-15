import { createError } from 'h3'

const SAFE_QUERY_KEY = /^[A-Za-z0-9_.-]{1,128}(?:\[\])?$/u
const MAX_QUERY_KEYS = 32
const MAX_VALUES_PER_KEY = 20
const MAX_VALUE_LENGTH = 512

export type ParagraphViewQuery = Record<string, string | string[]>

export function parseParagraphViewId(value: unknown): number {
  const paragraphId = Number(value)

  if (!Number.isInteger(paragraphId) || paragraphId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid View paragraph id.',
    })
  }

  return paragraphId
}

export function normalizeParagraphViewQuery(
  query: Record<string, unknown>,
): ParagraphViewQuery {
  const entries = Object.entries(query)

  if (entries.length > MAX_QUERY_KEYS) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Too many View query controls.',
    })
  }

  const normalized: ParagraphViewQuery = {}

  for (const [key, rawValue] of entries) {
    if (!SAFE_QUERY_KEY.test(key)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid View query control.',
      })
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue]

    if (values.length > MAX_VALUES_PER_KEY) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Too many values for a View query control.',
      })
    }

    const strings = values.map((value) => String(value))

    if (strings.some(value => value.length > MAX_VALUE_LENGTH)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'View query control value is too long.',
      })
    }

    normalized[key] = Array.isArray(rawValue) ? strings : strings[0] || ''
  }

  return normalized
}

export function buildParagraphViewPath(
  ceApiEndpoint: string,
  paragraphId: number,
): string {
  return `/api/drupal-ce${ceApiEndpoint}/stir-layout-builder/paragraph/${paragraphId}/view`
}
