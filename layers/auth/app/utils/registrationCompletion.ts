import type { RegisterResponse } from '../types/auth'

export type RegistrationRequirement =
  | 'approval'
  | 'verification'
  | 'complete'

export function registrationRequirement(
  response: RegisterResponse | null | undefined,
): RegistrationRequirement {
  if (response?.approval_required) return 'approval'
  if (response?.verification_required) return 'verification'

  return 'complete'
}
