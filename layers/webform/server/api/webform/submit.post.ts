import {
  defineEventHandler,
  createError,
  getHeader,
  setHeader,
  setResponseStatus,
  type H3Event,
} from 'h3'
import {
  assertWebformContentLength,
  assertWebformMultipartLimits,
  getWebformSubmissionLimits,
  type WebformSubmissionLimits,
} from '../../utils/webformLimits'
import { readWebformBody } from '../../utils/readWebformBody'
import type { WebformSubmissionResponse } from '../../../shared/types/webformSubmission'
import {
  assertStirDrupalResponseNotRedirect,
  buildStirDrupalHeaders,
  captureStirDrupalApiError,
  fetchStirDrupalCsrfToken,
  getStirDrupalApiConfig,
  getStirForwardedCookie,
} from '../../../../foundation/server/utils/stirDrupalApi'

type SubmissionBody = Record<string, unknown>
type ParsedSubmission = {
  body: SubmissionBody
  forwardBody: SubmissionBody | FormData
  contentType?: string
}

function normalizeUpstreamErrorStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 502
  const statusCode =
    (error as { statusCode?: unknown; status?: unknown }).statusCode ??
    (error as { status?: unknown }).status

  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
    ? statusCode
    : 502
}

function setBodyValue(
  body: SubmissionBody,
  key: string,
  value: unknown,
): void {
  const normalizedKey = key.endsWith('[]') ? key.slice(0, -2) : key
  const existing = body[normalizedKey]

  if (existing === undefined) {
    body[normalizedKey] = key.endsWith('[]') ? [value] : value
    return
  }

  body[normalizedKey] = Array.isArray(existing)
    ? [...existing, value]
    : [existing, value]
}

const parseUrlEncodedBody = (rawBody: string): SubmissionBody => {
  const body: SubmissionBody = {}

  for (const [key, value] of new URLSearchParams(rawBody)) {
    setBodyValue(body, key, value)
  }

  return body
}

async function parseSubmission(
  event: H3Event,
  limits: WebformSubmissionLimits,
): Promise<ParsedSubmission> {
  const contentType = getHeader(event, 'content-type') ?? ''

  const rawBody = await readWebformBody(event, limits)

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    const value = new TextDecoder().decode(rawBody)
    let body: SubmissionBody

    try {
      body = contentType.toLowerCase().includes('application/x-www-form-urlencoded')
        ? parseUrlEncodedBody(value)
        : value
          ? JSON.parse(value) as SubmissionBody
          : {}
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form submission body',
      })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid form submission body',
      })
    }

    return {
      body,
      forwardBody: body,
      contentType: 'application/json',
    }
  }

  let formData: FormData

  try {
    formData = await new Response(new Uint8Array(rawBody), {
      headers: { 'Content-Type': contentType },
    }).formData()
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid multipart form submission' })
  }

  assertWebformMultipartLimits(Array.from(formData.entries(), ([name, value]) => ({
    name,
    filename: typeof value === 'string' ? undefined : value.name,
    data: { byteLength: typeof value === 'string' ? new TextEncoder().encode(value).byteLength : value.size },
  })), limits)

  const body: SubmissionBody = {}

  for (const [name, value] of formData) {
    setBodyValue(body, name, typeof value === 'string' ? value : value.name)
  }

  return {
    body,
    forwardBody: formData,
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store, max-age=0')

  const limits = getWebformSubmissionLimits()

  assertWebformContentLength(event, limits)

  const submission = await parseSubmission(event, limits)
  const body = submission.body

  if (!body.webform_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Require a Turnstile token; Drupal stir_webform_rest performs verification.
  if (!body.turnstile_response) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CAPTCHA validation failed',
    })
  }

  try {
    const { baseUrl, apiKey, requestTimeoutMs } = getStirDrupalApiConfig()
    const csrfToken = await fetchStirDrupalCsrfToken(event)
    const cookie = getStirForwardedCookie(event)

    const drupalApiUrl = `${baseUrl}/api/stir_webform_rest/submit`
    const origin = getHeader(event, 'origin')
    const referer = getHeader(event, 'referer')
    const userAgent = getHeader(event, 'user-agent')

    const response = await $fetch.raw<WebformSubmissionResponse>(drupalApiUrl, {
      method: 'POST',
      headers: {
        ...(submission.contentType
          ? { 'Content-Type': submission.contentType }
          : {}),
        Accept: 'application/json',
        ...buildStirDrupalHeaders({ apiKey, cookie, csrfToken }),
        ...(origin ? { Origin: origin } : {}),
        ...(referer ? { Referer: referer } : {}),
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      body: submission.forwardBody,
      redirect: 'manual',
      timeout: requestTimeoutMs,
      ignoreResponseError: true,
    })

    assertStirDrupalResponseNotRedirect(response)

    if (response.status >= 400 && response.status < 500) {
      setResponseStatus(event, response.status)
      return response._data
    }

    if (response.status >= 500) {
      throw createError({ statusCode: 502 })
    }

    return response._data
  } catch (error) {
    captureStirDrupalApiError(event, error)

    throw createError({
      statusCode: normalizeUpstreamErrorStatus(error),
      statusMessage: 'Form submission failed. Please try again later.',
    })
  }
})
