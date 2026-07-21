import { describe, expect, it } from 'vitest'
import {
  mergeDrupalPageAccess,
  resolveDrupalPageAccess,
} from '../../layers/theme/app/utils/editorialAccess'

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

  it('does not treat read-only view and API tasks as editorial access', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42, roles: ['authenticated', 'class_subscriber'] },
      local_tasks: {
        primary: [
          { label: 'View', url: '/node/1' },
          { label: 'API', url: '/ce-api/node/1' },
        ],
        secondary: [],
      },
    }).hasEditorialAccess).toBe(false)
  })

  it('does not expose anonymous local tasks as editorial controls', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 0, roles: ['anonymous'] },
      local_tasks: { primary: [{ label: 'View', url: '/node/1' }] },
    }).hasEditorialAccess).toBe(false)
  })
})

describe('mergeDrupalPageAccess', () => {
  it('keeps administrator controls available when a route has no Drupal page payload', () => {
    const routeAccess = resolveDrupalPageAccess(undefined)
    const sessionAccess = resolveDrupalPageAccess({
      current_user: {
        authenticated: true,
        uid: 1,
        roles: ['authenticated', 'administrator'],
      },
    })

    expect(mergeDrupalPageAccess(routeAccess, sessionAccess)).toEqual({
      isAdministrator: true,
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('does not give ordinary authenticated users global editorial controls', () => {
    const routeAccess = resolveDrupalPageAccess(undefined)
    const sessionAccess = resolveDrupalPageAccess({
      current_user: {
        authenticated: true,
        uid: 42,
        roles: ['authenticated'],
      },
    })

    expect(mergeDrupalPageAccess(routeAccess, sessionAccess)).toEqual({
      isAdministrator: false,
      isAuthenticated: true,
      hasEditorialAccess: false,
    })
  })
})
