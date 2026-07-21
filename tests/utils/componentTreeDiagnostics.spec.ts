import { describe, expect, it, vi } from 'vitest'
import { prepareComponentTreeForDevelopment } from '../../layers/theme/app/utils/componentTreeDiagnostics'

const known = new Set(['node-page', 'paragraph-text', 'media-image'])
const resolveComponent = vi.fn((element: string) => known.has(element) ? element : null)

describe('componentTreeDiagnostics', () => {
  it('preserves known components while checking nested slots', () => {
    const input = {
      element: 'node-page',
      props: { title: 'Example' },
      slots: {
        body: '<p>Body</p>',
        section: [{ element: 'paragraph-text', props: {}, slots: {} }],
      },
    }

    expect(prepareComponentTreeForDevelopment(input, resolveComponent)).toEqual(input)
    expect(resolveComponent).toHaveBeenCalledWith('node-page')
    expect(resolveComponent).toHaveBeenCalledWith('paragraph-text')
  })

  it('replaces unresolved components and fields with visible diagnostics', () => {
    expect(prepareComponentTreeForDevelopment({
      element: 'unknown-card',
      props: {},
      slots: {},
    }, resolveComponent)).toMatchObject({
      element: 'stir-missing-component',
      props: { element: 'unknown-card', kind: 'missing-component' },
    })

    expect(prepareComponentTreeForDevelopment({
      element: 'field-mystery',
      props: {},
      slots: {},
    }, resolveComponent)).toMatchObject({
      element: 'stir-missing-component',
      props: { element: 'field-mystery', kind: 'unknown-field' },
    })
  })

  it('replaces malformed nodes instead of passing them to the renderer', () => {
    expect(prepareComponentTreeForDevelopment({ props: {} }, resolveComponent))
      .toMatchObject({
        element: 'stir-missing-component',
        props: { element: '', kind: 'invalid-shape' },
      })
  })
})
