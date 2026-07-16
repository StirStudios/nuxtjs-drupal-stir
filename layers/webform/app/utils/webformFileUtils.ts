import type { WebformFieldProps } from '#stir/types'

export const WEBFORM_FILE_FIELD_TYPES = [
  'file',
  'managed_file',
  'webform_document_file',
  'webform_image_file',
  'webform_audio_file',
  'webform_video_file',
]

type PayloadValue =
  | string
  | number
  | boolean
  | File
  | File[]
  | Record<string, unknown>
  | unknown[]
  | null
  | undefined

export function isWebformFileField(field: WebformFieldProps): boolean {
  return WEBFORM_FILE_FIELD_TYPES.includes(String(field['#type'] ?? ''))
}

export function allowsMultipleFiles(field: WebformFieldProps): boolean {
  const multiple = Number(field['#multiple'])

  return (
    field['#multiple'] === true ||
    (Number.isFinite(multiple) && multiple > 1) ||
    (typeof field['#cardinality'] === 'number' && field['#cardinality'] !== 1)
  )
}

export function getFileExtensions(field: WebformFieldProps): string[] {
  const validators = field['#upload_validators'] as
    | Record<string, unknown>
    | undefined
  const validatorExtensions = Array.isArray(
    validators?.file_validate_extensions,
  )
    ? validators.file_validate_extensions[0]
    : undefined
  const raw =
    field['#file_extensions'] ??
    field['#extensions'] ??
    validatorExtensions ??
    ''

  return String(raw)
    .split(/[\s,]+/)
    .map((extension) => extension.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean)
}

export function getFileAccept(field: WebformFieldProps): string | undefined {
  const accept = String(field['#accept'] ?? '').trim()

  if (accept) return accept

  const extensions = getFileExtensions(field)

  return extensions.length
    ? extensions.map((extension) => `.${extension}`).join(',')
    : undefined
}

export function getFileMaxSize(field: WebformFieldProps): number | undefined {
  const validators = field['#upload_validators'] as
    | Record<string, unknown>
    | undefined
  const validatorSize = Array.isArray(validators?.file_validate_size)
    ? validators.file_validate_size[0]
    : undefined
  const raw = field['#max_filesize'] ?? field['#max_size'] ?? validatorSize

  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return undefined

  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i)

  if (!match) return undefined

  const value = Number(match[1])
  const unit = String(match[2] ?? 'b').toLowerCase()
  const multiplier =
    unit === 'gb'
      ? 1024 ** 3
      : unit === 'mb'
        ? 1024 ** 2
        : unit === 'kb'
          ? 1024
          : 1

  return Math.round(value * multiplier)
}

export function isFileValue(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

export function hasFileValue(value: unknown): boolean {
  if (isFileValue(value)) return true
  if (Array.isArray(value)) return value.some(hasFileValue)
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasFileValue)
  }

  return false
}

export function buildWebformFormData(
  payload: Record<string, PayloadValue>,
): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    appendFormDataValue(formData, key, value)
  }

  return formData
}

function appendFormDataValue(
  formData: FormData,
  key: string,
  value: PayloadValue,
): void {
  if (value === undefined || value === null) return

  if (isFileValue(value)) {
    formData.append(key, value, value.name)
    return
  }

  if (Array.isArray(value)) {
    if (value.every(isFileValue)) {
      const files = value as File[]

      for (const file of files) {
        formData.append(`${key}[]`, file, file.name)
      }
      return
    }

    formData.append(key, JSON.stringify(value))
    return
  }

  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value))
    return
  }

  formData.append(key, String(value))
}
