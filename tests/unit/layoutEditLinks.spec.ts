import { describe, expect, it } from 'vitest'
import { buildLayoutEditLinkIndex } from '../../layers/theme/app/utils/layoutEditLinks'

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
