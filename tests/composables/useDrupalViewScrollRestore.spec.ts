import { describe, expect, it } from 'vitest'
import {
  canRestoreDrupalViewScroll,
  shouldPersistDrupalViewScroll,
  shouldRestoreDrupalViewScroll,
} from '../../layers/theme/app/composables/useDrupalViewScrollRestore'

describe('useDrupalViewScrollRestore', () => {
  it('persists scroll only for views with multiple pages', () => {
    expect(shouldPersistDrupalViewScroll(undefined)).toBe(false)
    expect(shouldPersistDrupalViewScroll(0)).toBe(false)
    expect(shouldPersistDrupalViewScroll(1)).toBe(false)
    expect(shouldPersistDrupalViewScroll(2)).toBe(true)
  })

  it('does not move the viewport during ordinary route navigation', () => {
    expect(shouldRestoreDrupalViewScroll(false, null, '/post')).toBe(false)
    expect(shouldRestoreDrupalViewScroll(false, '/production', '/post')).toBe(false)
  })

  it('restores a deliberate history or listing return position', () => {
    expect(shouldRestoreDrupalViewScroll(true, null, '/post')).toBe(true)
    expect(shouldRestoreDrupalViewScroll(false, '/post', '/post')).toBe(true)
  })

  it('waits until rebuilt View content can support the saved position', () => {
    expect(canRestoreDrupalViewScroll(3300, 900, 900)).toBe(false)
    expect(canRestoreDrupalViewScroll(3300, 4192, 900)).toBe(true)
  })
})
