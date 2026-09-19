import { describe, expect, it } from 'vitest'
import {
  mergeDrupalPageAccess,
  resolveAuthSessionAccess,
  resolveDrupalPageAccess,
} from '../../layers/theme/app/utils/editorialAccess'

describe('resolveDrupalPageAccess', () => {
  it('grants editorial access from the Drupal capability without local tasks', () => {
    expect(resolveDrupalPageAccess({
      current_user: { id: '1', capabilities: { editorialUi: true } },
      local_tasks: { primary: [], secondary: [] },
    })).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('ignores role names entirely', () => {
    expect(resolveDrupalPageAccess({
      current_user: {
        id: '1',
        roles: ['authenticated', 'administrator'],
        capabilities: { editorialUi: false },
      },
      local_tasks: { primary: [], secondary: [] },
    } as never).hasEditorialAccess).toBe(false)
  })

  it('allows authenticated editors when Drupal exposes accessible tasks', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42, capabilities: { editorialUi: false } },
      local_tasks: {
        primary: [{ label: 'Edit', url: '/node/1/edit' }],
        secondary: [],
      },
    })).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('does not infer editorial access from authentication alone', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42 },
      local_tasks: { primary: [], secondary: [] },
    }).hasEditorialAccess).toBe(false)
  })

  it('does not treat read-only view and API tasks as editorial access', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42 },
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
      current_user: { id: 0, capabilities: { editorialUi: false } },
      local_tasks: { primary: [{ label: 'Edit', url: '/node/1/edit' }] },
    })).toEqual({
      isAuthenticated: false,
      hasEditorialAccess: false,
    })
  })

  it('accepts Lupus string and numeric user ids', () => {
    expect(resolveDrupalPageAccess({ current_user: { id: '7' } }).isAuthenticated).toBe(true)
    expect(resolveDrupalPageAccess({ current_user: { id: 0 } }).isAuthenticated).toBe(false)
  })
})

describe('resolveAuthSessionAccess', () => {
  it('reads the editorial capability from the session user', () => {
    expect(resolveAuthSessionAccess({
      loggedIn: true,
      user: { uid: 1, capabilities: { editorialUi: true } },
    })).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('grants nothing without a session user', () => {
    expect(resolveAuthSessionAccess({ loggedIn: false, user: null })).toEqual({
      isAuthenticated: false,
      hasEditorialAccess: false,
    })
  })
})

describe('mergeDrupalPageAccess', () => {
  it('keeps session editorial access on a route without a Drupal page payload', () => {
    expect(mergeDrupalPageAccess(
      resolveDrupalPageAccess(undefined),
      resolveAuthSessionAccess({
        loggedIn: true,
        user: { uid: 1, capabilities: { editorialUi: true } },
      }),
    )).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: true,
    })
  })

  it('does not give ordinary authenticated users editorial controls', () => {
    expect(mergeDrupalPageAccess(
      resolveDrupalPageAccess(undefined),
      resolveAuthSessionAccess({
        loggedIn: true,
        user: { uid: 42, capabilities: { editorialUi: false } },
      }),
    )).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: false,
    })
  })
})
