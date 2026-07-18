import { describe, expect, it } from 'vitest'
import {
  buildLayoutEditLinkIndex,
  withEditorDestination,
} from '../../layers/theme/app/utils/layoutEditLinks'

describe('buildLayoutEditLinkIndex', () => {
  it('indexes nested layout paragraph links by UUID', () => {
    const index = buildLayoutEditLinkIndex({
      content: [
        {
          element: 'paragraph-layout',
          props: { uuid: 'layout-one', editLink: ' /paragraph/1/edit ' },
          children: [
            {
              element: 'paragraph-layout',
              props: { uuid: 'layout-two', editLink: '/paragraph/2/edit' },
            },
          ],
        },
      ],
    })

    expect(Object.fromEntries(index)).toEqual({
      'layout-one': '/paragraph/1/edit',
      'layout-two': '/paragraph/2/edit',
    })
  })

  it('ignores non-layout nodes and incomplete links', () => {
    const index = buildLayoutEditLinkIndex([
      { element: 'paragraph-text', props: { uuid: 'text', editLink: '/edit' } },
      { element: 'paragraph-layout', props: { uuid: '', editLink: '/edit' } },
      { element: 'paragraph-layout', props: { uuid: 'missing-link' } },
    ])

    expect(index.size).toBe(0)
  })

  it('does not recurse forever when passed a cyclic extension object', () => {
    const cyclic: Record<string, unknown> = {
      element: 'paragraph-layout',
      props: { uuid: 'layout', editLink: '/edit' },
    }

    cyclic.self = cyclic

    expect(buildLayoutEditLinkIndex(cyclic).get('layout')).toBe('/edit')
  })
})

describe('withEditorDestination', () => {
  it('replaces Drupal destination with the current frontend page', () => {
    expect(withEditorDestination(
      'https://cms.example.com/node/3/edit?destination=%2Fnode%2F3',
      'https://www.example.com/contact?preview=1#section-6',
    )).toBe(
      'https://cms.example.com/node/3/edit?destination=https%3A%2F%2Fwww.example.com%2Fcontact%3Fpreview%3D1%23section-6',
    )
  })

  it('leaves relative and unsafe links unchanged', () => {
    expect(withEditorDestination('/node/3/edit', 'https://www.example.com/contact'))
      .toBe('/node/3/edit')
    expect(withEditorDestination('javascript:alert(1)', 'https://www.example.com/contact'))
      .toBe('javascript:alert(1)')
  })
})
