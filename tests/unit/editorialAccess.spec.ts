import { describe, expect, it } from 'vitest'
import {
  mergeDrupalPageAccess,
  resolveAuthSessionAccess,
  resolveDrupalPageAccess,
} from '../../layers/theme/app/utils/editorialAccess'

describe('resolveDrupalPageAccess', () => {
  it('grants editorial access from the Drupal capability', () => {
    expect(resolveDrupalPageAccess({
      current_user: { id: '1', capabilities: { editorialUi: true } },
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

  it('never grants editorial access from local tasks', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42, capabilities: { editorialUi: false } },
      local_tasks: {
        primary: [{ label: 'Edit', url: '/user/42/edit' }],
        secondary: [],
      },
    } as never)).toEqual({
      isAuthenticated: true,
      hasEditorialAccess: false,
    })
  })

  it('does not infer editorial access from authentication alone', () => {
    expect(resolveDrupalPageAccess({
      current_user: { uid: 42 },
    }).hasEditorialAccess).toBe(false)
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
