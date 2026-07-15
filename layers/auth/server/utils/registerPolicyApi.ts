import type {
  RegisterPolicyProducerResponse,
  RegisterPolicyResponse,
  RegistrationMode,
} from '../../shared/types/registerPolicy'
import { layerAuthDrupalApiRequest } from './drupalApi'

const openRegistrationModes = new Set<RegistrationMode>([
  'visitors',
  'visitors_admin_approval',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRegistrationMode(value: unknown): value is RegistrationMode {
  return value === 'admin_only' || openRegistrationModes.has(value as RegistrationMode)
}

export function parseRegisterPolicyResponse(
  value: unknown,
): RegisterPolicyProducerResponse {
  if (!isRecord(value) || typeof value.allowed !== 'boolean') {
    throw new TypeError('Invalid Drupal registration-policy contract at root')
  }
  if (!isRegistrationMode(value.mode)) {
    throw new TypeError('Invalid Drupal registration-policy contract at mode')
  }

  const expectedAllowed = openRegistrationModes.has(value.mode)

  if (value.allowed !== expectedAllowed) {
    throw new TypeError('Invalid Drupal registration-policy contract at allowed')
  }

  return {
    allowed: value.allowed,
    mode: value.mode,
  }
}

export async function fetchRegisterPolicy(
  event: Parameters<typeof layerAuthDrupalApiRequest>[0],
): Promise<RegisterPolicyResponse> {
  try {
    const response = await layerAuthDrupalApiRequest<unknown>(
      event,
      '/api/auth/register-policy',
      { method: 'GET' },
    )

    return parseRegisterPolicyResponse(response)
  }
  catch {
    return { allowed: false }
  }
}
