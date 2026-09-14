import { createError, defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest } from '../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../foundation/server/utils/stirDrupalApi'

const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/
const MAX_FIELDS = 50
const MAX_STRING_LENGTH = 2000
const MAX_LIST_ITEMS = 50

// Base user entity keys. Registration fields are project data handed to
// Drupal's presave event and must never be able to name account state.
const RESERVED_FIELD_KEYS = new Set([
  'access',
  'changed',
  'created',
  'default_langcode',
  'init',
  'langcode',
  'login',
  'mail',
  'name',
  'pass',
  'path',
  'preferred_admin_langcode',
  'preferred_langcode',
  'roles',
  'status',
  'timezone',
  'uid',
  'uuid',
])

type RegisterFieldScalar = string | number | boolean

const isScalar = (value: unknown): value is RegisterFieldScalar =>
  (typeof value === 'string' && value.length <= MAX_STRING_LENGTH)
  || (typeof value === 'number' && Number.isFinite(value))
  || typeof value === 'boolean'

const rejectField = (key: string): never => {
  throw createError({
    statusCode: 400,
    statusMessage: `Registration field "${key}" is not allowed`,
  })
}

const registrationFields = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const entries = Object.entries(value)

  if (entries.length > MAX_FIELDS) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Too many registration fields',
    })
  }

  const configured = (useRuntimeConfig().stirAuthRegister as
    { allowedFields?: unknown } | undefined)?.allowedFields
  const allowed = Array.isArray(configured) && configured.length
    ? new Set(configured)
    : undefined

  for (const [key, fieldValue] of entries) {
    if (
      !FIELD_KEY_PATTERN.test(key)
      || RESERVED_FIELD_KEYS.has(key)
      || (allowed && !allowed.has(key))
    ) {
      rejectField(key)
    }

    const validValue = fieldValue === null
      || isScalar(fieldValue)
      || (Array.isArray(fieldValue)
        && fieldValue.length <= MAX_LIST_ITEMS
        && fieldValue.every(isScalar))

    if (!validValue) rejectField(key)
  }

  return Object.fromEntries(entries)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown
    password?: unknown
    display_name?: unknown
    turnstile_response?: unknown
    fields?: unknown
  }>(event)

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const displayName =
    typeof body?.display_name === 'string' ? body.display_name.trim() : ''
  const turnstileResponse =
    typeof body?.turnstile_response === 'string'
      ? body.turnstile_response.trim()
      : ''

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const fields = registrationFields(body?.fields)

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        display_name: displayName,
        turnstile_response: turnstileResponse,
        fields,
      },
    })
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Registration failed')
  }
})
