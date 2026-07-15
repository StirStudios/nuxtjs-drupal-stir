import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registrationRequirement } from '../../layers/auth/app/utils/registrationCompletion'
import type { RegisterResponse } from '../../layers/auth/app/types/auth'

describe('registrationRequirement', () => {
  it('uses the producer fixture to keep admin approval distinct from verification', () => {
    const response = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          '../../contracts/stir-tools/v1/fixtures/auth-register-admin-approval.json',
        ),
        'utf8',
      ),
    ) as RegisterResponse

    expect(registrationRequirement(response)).toBe('approval')
  })

  it('prioritizes approval when a legacy payload sets both requirements', () => {
    expect(registrationRequirement({
      approval_required: true,
      verification_required: true,
    })).toBe('approval')
  })

  it('falls back to complete when no requirement is present', () => {
    expect(registrationRequirement({ created: true })).toBe('complete')
  })
})
