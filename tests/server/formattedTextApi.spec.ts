import { describe, expect, it } from 'vitest'
import {
  buildFormattedTextPath,
  parseFormattedTextRouteTarget,
} from '../../layers/editorial/server/utils/formattedTextApi'

describe('editorial formatted-text API policy', () => {
  it('accepts canonical entity and field targets', () => {
    expect(parseFormattedTextRouteTarget({
      entityType: 'node',
      entityId: '27826',
      fieldName: 'body',
    })).toEqual({
      entityType: 'node',
      entityId: 27826,
      fieldName: 'body',
    })
  })

  it.each([
    undefined,
    {},
    { entityType: 'node', entityId: '0', fieldName: 'body' },
    { entityType: 'Node', entityId: '1', fieldName: 'body' },
    { entityType: 'node', entityId: '1.5', fieldName: 'body' },
    { entityType: 'node', entityId: '1', fieldName: '../body' },
  ])('rejects unsafe or incomplete targets: %j', (params) => {
    expect(() => parseFormattedTextRouteTarget(params)).toThrow(
      'Invalid formatted-text target.',
    )
  })

  it('builds the Drupal CE formatted-text endpoint', () => {
    expect(buildFormattedTextPath('/ce-api', {
      entityType: 'node',
      entityId: 27826,
      fieldName: 'body',
    })).toBe(
      '/api/drupal-ce/ce-api/stir-layout-builder/entity/node/27826/body/text',
    )
  })
})
