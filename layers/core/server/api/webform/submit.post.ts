import {
  defineEventHandler,
  readBody,
  readMultipartFormData,
  createError,
  getHeader,
  type H3Event,
} from 'h3'
import { buildDrupalHeaders } from '../../utils/drupalHeaders'

type SubmissionBody = Record<string, unknown>
type ParsedSubmission = {
  body: SubmissionBody
  forwardBody: SubmissionBody | FormData
  contentType?: string
}

function normalizeErrorStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 500
  const statusCode =
    (error as { statusCode?: unknown; status?: unknown }).statusCode ??
    (error as { status?: unknown }).status

  return typeof statusCode === 'number' ? statusCode : 500
}

function normalizeErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object')
    return 'Form submission failed. Please try again later.'

  const statusMessage = (error as { statusMessage?: unknown }).statusMessage

  if (typeof statusMessage === 'string' && statusMessage.trim()) {
    return statusMessage
  }

  const message = (error as { message?: unknown }).message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return 'Form submission failed. Please try again later.'
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

async function parseSubmission(event: H3Event): Promise<ParsedSubmission> {
  const contentType = getHeader(event, 'content-type') ?? ''

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    const body = await readBody<SubmissionBody>(event)

    return {
      body,
      forwardBody: body,
      contentType: 'application/json',
    }
  }

  const parts = await readMultipartFormData(event)
  const body: SubmissionBody = {}
  const formData = new FormData()

  for (const part of parts ?? []) {
    if (!part.name) continue

    if (part.filename) {
      const data = new Uint8Array(part.data)
      const blob = new Blob([data], {
        type: part.type || 'application/octet-stream',
      })

      formData.append(part.name, blob, part.filename)
      setBodyValue(body, part.name, part.filename)
      continue
    }

    const value = part.data.toString('utf8')

    formData.append(part.name, value)
    setBodyValue(body, part.name, value)
  }

  return {
    body,
    forwardBody: formData,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey =
    typeof config.apiKey === 'string' && config.apiKey.trim()
      ? config.apiKey
      : ''

  try {
    const fetchJson = $fetch as <T>(
      request: string,
      options?: Record<string, unknown>,
    ) => Promise<T>
    const submission = await parseSubmission(event)
    const body = submission.body

    if (!body?.webform_id) {
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

    const { csrfToken } = await fetchJson<{ csrfToken: string }>('/api/auth/csrf')

    const drupalApiUrl = `${config.public.api}/api/stir_webform_rest/submit`
    const origin = getHeader(event, 'origin')
    const referer = getHeader(event, 'referer')
    const forwardedFor = getHeader(event, 'x-forwarded-for')
    const forwardedProto = getHeader(event, 'x-forwarded-proto')
    const userAgent = getHeader(event, 'user-agent')

    return await fetchJson<Record<string, unknown>>(drupalApiUrl, {
      method: 'POST',
      headers: {
        ...(submission.contentType
          ? { 'Content-Type': submission.contentType }
          : {}),
        Accept: 'application/json',
        ...buildDrupalHeaders({ apiKey, csrfToken }),
        ...(origin ? { Origin: origin } : {}),
        ...(referer ? { Referer: referer } : {}),
        ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
        ...(forwardedProto ? { 'X-Forwarded-Proto': forwardedProto } : {}),
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      body: submission.forwardBody,
    })
  } catch (error) {
    throw createError({
      statusCode: normalizeErrorStatus(error),
      statusMessage: normalizeErrorMessage(error),
    })
  }
})
