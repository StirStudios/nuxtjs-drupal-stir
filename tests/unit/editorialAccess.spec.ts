import { describe, expect, it } from 'vitest'
import { resolveDrupalPageAccess } from '../../layers/theme/app/utils/editorialAccess'

describe('resolveDrupalPageAccess', () => {
  it('keeps administrators compatible even without local tasks', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 1, roles: ['authenticated', 'administrator'] },
      local_tasks: { primary: [], secondary: [] },
    })).toEqual({
      isAdministrator: true,
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('allows authenticated editors when Drupal exposes accessible tasks', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42, roles: ['authenticated', 'content_editor'] },
      local_tasks: {
        primary: [{ label: 'Edit', url: '/node/1/edit' }],
        secondary: [],
      },
    })).toMatchObject({
      isAdministrator: false,
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('does not infer editorial access from authentication alone', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42, roles: ['authenticated'] },
      local_tasks: { primary: [], secondary: [] },
    }).hasEditorialAccess).toBe(false)
  })

  it('does not expose anonymous local tasks as editorial controls', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 0, roles: ['anonymous'] },
      local_tasks: { primary: [{ label: 'View', url: '/node/1' }] },
    }).hasEditorialAccess).toBe(false)
  })
})
