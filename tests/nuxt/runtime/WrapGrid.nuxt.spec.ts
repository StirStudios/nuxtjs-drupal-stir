import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WrapGrid from '../../../layers/theme/app/components/Wrap/Grid.vue'

describe('WrapGrid (Nuxt runtime)', () => {
  it('renders no element when the grid has no presentation classes', async () => {
    const wrapper = await mountSuspended(WrapGrid, {
      slots: {
        default: '<span>Direct content</span>',
      },
    })

    expect(wrapper.findAll('div')).toHaveLength(0)
    expect(wrapper.find('span').text()).toBe('Direct content')
  })

  it('combines non-card wrapper and grid classes on one element', async () => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: {
        classes: 'outer-class',
        gridItems: 'grid grid-cols-2',
        spacing: 'py-10',
        width: 'max-w-4xl',
      },
      slots: {
        default: '<span>Grid content</span>',
      },
    })
    const divs = wrapper.findAll('div')

    expect(divs).toHaveLength(1)
    expect(divs[0]?.classes()).toEqual(expect.arrayContaining([
      'outer-class',
      'grid',
      'grid-cols-2',
      'py-10',
      'max-w-4xl',
    ]))
  })

  it('keeps separate content and gradient layers for cards', async () => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: {
        card: true,
        gridItems: 'grid grid-cols-2',
      },
      slots: {
        default: '<span>Card content</span>',
      },
    })
    const content = wrapper.find('span')
    const inner = content.element.parentElement
    const outer = inner?.parentElement

    expect(inner?.classList.contains('grid')).toBe(true)
    expect(inner?.classList.contains('relative')).toBe(true)
    expect(outer?.classList.contains('isolate')).toBe(true)
  })
})
