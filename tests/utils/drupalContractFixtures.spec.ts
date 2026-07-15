import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const fixtures = JSON.parse(readFileSync(
  resolve(__dirname, '../fixtures/drupal-contracts.json'),
  'utf8',
)) as Record<string, unknown>

describe('sanitized Drupal contract fixtures', () => {
  it('preserves representative CE page, view, media, menu, and webform shapes', () => {
    expect(fixtures).toMatchObject({
      schemaVersion: 1,
      page: { content: { element: 'node--default', slots: { section: expect.any(Array) } } },
      view: {
        element: 'drupal-view--default',
        props: {
          viewId: expect.any(String),
          displayId: expect.any(String),
          parentUuid: expect.any(String),
        },
        slots: { rows: expect.any(Array) },
      },
      media: {
        element: 'media-image',
        props: { width: expect.any(Number), height: expect.any(Number) },
      },
      menu: expect.any(Array),
      webform: {
        webformId: expect.any(String),
        fields: expect.any(Object),
        actions: expect.any(Array),
        webformConfirmationType: expect.any(String),
      },
    })
  })

  it('contains no production origins or credentials', () => {
    const serialized = JSON.stringify(fixtures)

    expect(serialized).not.toMatch(/https?:\/\//)
    expect(serialized).not.toMatch(/api[_-]?key|secret|cookie/i)
  })
})
