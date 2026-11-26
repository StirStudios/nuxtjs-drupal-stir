import {
  defineEventHandler,
  createError,
  getHeader,
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
  createStirDrupalUpstreamError,
  markStirPrivateResponse,
  stirDrupalApiFetch,
} from '../../../../foundation/server/utils/stirDrupalApi'

type SubmissionBody = Record<string, unknown>
type ParsedSubmission = {
  body: SubmissionBody
  forwardBody: SubmissionBody | FormData
  contentType?: string
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
  markStirPrivateResponse(event)

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
    const origin = getHeader(event, 'origin')
    const referer = getHeader(event, 'referer')
    const userAgent = getHeader(event, 'user-agent')
    // Same-origin is not enforced: an embedded form (the calculator widget)
    // posts from its host site. Drupal checks the Turnstile token, and asks a
    // signed-in visitor's request for its CSRF token.
    const response = await stirDrupalApiFetch<WebformSubmissionResponse>(
      event,
      '/api/stir_webform_rest/submit',
      {
        method: 'POST',
        body: submission.forwardBody,
        headers: {
          ...(submission.contentType ? { 'Content-Type': submission.contentType } : {}),
          Accept: 'application/json',
          ...(origin ? { Origin: origin } : {}),
          ...(referer ? { Referer: referer } : {}),
          ...(userAgent ? { 'User-Agent': userAgent } : {}),
        },
        enforceSameOrigin: false,
        forwardClientIp: true,
        forwardCookies: true,
        ignoreResponseError: true,
      },
    )

    if (response.status >= 400 && response.status < 500) {
      setResponseStatus(event, response.status)
      return response._data
    }

    if (response.status >= 500) {
      throw createError({ statusCode: response.status, data: response._data })
    }

    return response._data
  } catch (error) {
    throw createStirDrupalUpstreamError(error, 'Form submission failed. Please try again later.')
  }
})
