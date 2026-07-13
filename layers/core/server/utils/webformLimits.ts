import { createError, getHeader, type H3Event } from 'h3'

const DEFAULT_MAX_REQUEST_BYTES = 10 * 1024 * 1024
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024
const DEFAULT_MAX_FILES = 5
const DEFAULT_MAX_FIELDS = 100

export type WebformSubmissionLimits = {
  maxRequestBytes: number
  maxFileBytes: number
  maxFiles: number
  maxFields: number
}

export type WebformMultipartPart = {
  data: { byteLength: number }
  filename?: string
  name?: string
}

const normalizePositiveInteger = (
  value: unknown,
  fallback: number,
): number => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const getWebformSubmissionLimits = (
  runtimeConfig: ReturnType<typeof useRuntimeConfig> = useRuntimeConfig(),
): WebformSubmissionLimits => {
  const rawConfig = (runtimeConfig as Record<string, unknown>)
    .webformSubmissionLimits
  const config = rawConfig && typeof rawConfig === 'object'
    ? rawConfig as Record<string, unknown>
    : {}

  return {
    maxRequestBytes: normalizePositiveInteger(
      config.maxRequestBytes,
      DEFAULT_MAX_REQUEST_BYTES,
    ),
    maxFileBytes: normalizePositiveInteger(
      config.maxFileBytes,
      DEFAULT_MAX_FILE_BYTES,
    ),
    maxFiles: normalizePositiveInteger(config.maxFiles, DEFAULT_MAX_FILES),
    maxFields: normalizePositiveInteger(config.maxFields, DEFAULT_MAX_FIELDS),
  }
}

const throwPayloadTooLarge = (message: string): never => {
  throw createError({
    statusCode: 413,
    statusMessage: message,
  })
}

export const assertWebformContentLength = (
  event: H3Event,
  limits: WebformSubmissionLimits,
): void => {
  const contentLength = Number(getHeader(event, 'content-length'))

  if (Number.isFinite(contentLength) && contentLength > limits.maxRequestBytes) {
    throwPayloadTooLarge('Form submission exceeds the request size limit')
  }
}

export const assertWebformRawBodySize = (
  byteLength: number,
  limits: WebformSubmissionLimits,
): void => {
  if (byteLength > limits.maxRequestBytes) {
    throwPayloadTooLarge('Form submission exceeds the request size limit')
  }
}

export const assertWebformMultipartLimits = (
  parts: WebformMultipartPart[],
  limits: WebformSubmissionLimits,
): void => {
  let totalBytes = 0
  let fileCount = 0
  let fieldCount = 0

  for (const part of parts) {
    totalBytes += part.data.byteLength

    if (part.filename) {
      fileCount += 1

      if (part.data.byteLength > limits.maxFileBytes) {
        throwPayloadTooLarge('An uploaded file exceeds the file size limit')
      }
    } else {
      fieldCount += 1
    }
  }

  if (totalBytes > limits.maxRequestBytes) {
    throwPayloadTooLarge('Form submission exceeds the request size limit')
  }

  if (fileCount > limits.maxFiles) {
    throwPayloadTooLarge('Form submission contains too many files')
  }

  if (fieldCount > limits.maxFields) {
    throwPayloadTooLarge('Form submission contains too many fields')
  }
}
