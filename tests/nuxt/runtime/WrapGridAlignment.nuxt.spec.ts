import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import WrapGrid from '../../../layers/theme/app/components/Wrap/Grid.vue'

describe('layout container alignment', () => {
  it.each([
    { align: undefined, expected: ['mx-auto'] },
    { align: 'md:flex justify-start', expected: ['ms-0', 'me-auto'] },
    { align: 'md:flex justify-center', expected: ['mx-auto'] },
    { align: 'md:flex justify-end', expected: ['ms-auto', 'me-0'] },
  ])('positions content inside the centered container for $align', async ({ align, expected }) => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: { container: true, width: 'max-w-3xl', gridItems: 'grid grid-cols-2', align },
      slots: { default: '<p>First</p><p>Second</p>' },
    })

    const grid = wrapper.get('.grid')
    const container = grid.element.parentElement
    const classes = grid.classes()

    expect(container?.classList).toContain('mx-auto')
    expect(container?.classList).toContain('max-w-(--ui-container)')
    expect(container?.classList).not.toContain('max-w-3xl')
    expect(classes).not.toContain('max-w-(--ui-container)')

    for (const name of expected) expect(classes).toContain(name)
    expect(classes).toContain('max-w-3xl')
    expect(classes).not.toContain('flex')
    expect(classes.some(name => name.startsWith('text-'))).toBe(false)
    wrapper.unmount()
  })
  it('does not add a container when disabled', async () => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: { container: false, width: 'max-w-3xl', gridItems: 'grid', align: 'justify-end' },
      slots: { default: '<p>Content</p>' },
    })

    expect(wrapper.findAll('div')).toHaveLength(1)
    expect(wrapper.get('.grid').classes()).toContain('ms-auto')
    expect(wrapper.get('.grid').classes()).not.toContain('max-w-(--ui-container)')
    wrapper.unmount()
  })
})
