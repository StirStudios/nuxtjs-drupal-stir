import * as v from 'valibot'
import type { StirListingResponse } from '../../shared/types/listing'

const MACHINE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

const nonNegativeInteger = v.pipe(v.number(), v.integer(), v.minValue(0))
const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1))

const listingFilterOptionSchema = v.looseObject({
  value: v.union([v.string(), v.number()]),
  label: v.string(),
})

export const stirListingResponseSchema = v.strictObject({
  schemaVersion: v.literal(1),
  listing: v.pipe(v.string(), v.regex(MACHINE_NAME_PATTERN)),
  items: v.array(v.record(v.string(), v.unknown())),
  pager: v.strictObject({
    page: nonNegativeInteger,
    pageSize: v.pipe(positiveInteger, v.maxValue(100)),
    total: v.nullable(nonNegativeInteger),
    totalPages: v.nullable(nonNegativeInteger),
    hasNext: v.boolean(),
  }),
  filters: v.strictObject({
    active: v.record(v.string(), v.array(v.string())),
    options: v.record(v.string(), v.array(listingFilterOptionSchema)),
  }),
  sort: v.strictObject({
    by: v.pipe(v.string(), v.minLength(1)),
    order: v.picklist(['asc', 'desc']),
  }),
  meta: v.strictObject({
    provider: v.pipe(v.string(), v.minLength(1)),
    summaryEntityType: v.pipe(v.string(), v.minLength(1)),
    summaryViewMode: v.pipe(v.string(), v.minLength(1)),
    personalized: v.boolean(),
  }),
})

export function parseStirListingId(value: unknown): string {
  if (typeof value !== 'string' || !MACHINE_NAME_PATTERN.test(value)) {
    throw new TypeError('Invalid Stir listing id.')
  }

  return value
}

export function parseStirListingResponse(value: unknown): StirListingResponse {
  const result = v.safeParse(stirListingResponseSchema, value)

  if (!result.success) {
    throw new TypeError('Drupal returned an invalid Stir listing response.')
  }

  return result.output
}

export function isPrivateStirListingResponse(options: {
  hasRequestCookie: boolean
  setsSessionCookie: boolean
  personalized: boolean
}): boolean {
  return options.hasRequestCookie
    || options.setsSessionCookie
    || options.personalized
}
