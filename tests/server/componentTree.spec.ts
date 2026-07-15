import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseComponentTreeContent,
  parseComponentTreeNode,
} from '../../layers/core/server/utils/componentTree'

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/component-tree.json',
), 'utf8'))

describe('componentTree', () => {
  it('parses the source-independent producer fixture recursively', () => {
    const fixture = producerFixture()
    const parsed = parseComponentTreeNode(fixture)

    expect(parsed).toEqual(fixture)
    expect(parsed.slots.body).toBe('<p>Rendered body text.</p>')
    expect(parsed.slots.media).toMatchObject([{ element: 'media-image' }])
    expect(parsed.slots.level).toMatchObject([{ element: 'entity-reference' }])
  })

  it('normalizes omitted and PHP-empty props and slots', () => {
    expect(parseComponentTreeNode({ element: 'paragraph-text' })).toEqual({
      element: 'paragraph-text',
      props: {},
      slots: {},
    })
    expect(parseComponentTreeNode({
      element: 'paragraph-text',
      props: [],
      slots: [],
    })).toEqual({
      element: 'paragraph-text',
      props: {},
      slots: {},
    })
  })

  it('accepts strings and arrays as recursive slot content', () => {
    expect(parseComponentTreeContent([
      '<p>Rendered text</p>',
      { element: 'media-image' },
    ])).toEqual([
      '<p>Rendered text</p>',
      { element: 'media-image', props: {}, slots: {} },
    ])
  })

  it('rejects undocumented keys and malformed nested nodes', () => {
    expect(() => parseComponentTreeNode({
      element: 'node-page',
      props: {},
      slots: {},
      regions: {},
    })).toThrow('Invalid Drupal component tree contract at regions')

    expect(() => parseComponentTreeNode({
      element: 'node-page',
      slots: {
        section: [{ element: '', props: {}, slots: {} }],
      },
    })).toThrow('slots.section.0.element')
  })
})
