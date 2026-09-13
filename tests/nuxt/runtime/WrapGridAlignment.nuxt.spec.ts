import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import WrapGrid from '../../../layers/theme/app/components/Wrap/Grid.vue'
import type { AlignConfig } from '../../../layers/theme/app/utils/gridClasses'

describe('layout container alignment', () => {
  it.each([
    { align: undefined, expected: ['mx-auto'] },
    { align: { justify: 'start' } satisfies AlignConfig, expected: ['ms-0', 'me-auto'] },
    { align: { justify: 'center' } satisfies AlignConfig, expected: ['mx-auto'] },
    { align: { justify: 'end' } satisfies AlignConfig, expected: ['ms-auto', 'me-0'] },
  ])('positions content inside the centered container for $align', async ({ align, expected }) => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: { container: true, width: 'md', gridItems: { columns: { default: 2 } }, align },
      slots: { default: '<p>First</p><p>Second</p>' },
    })

    const grid = wrapper.get('.grid')
    const container = grid.element.parentElement
    const classes = grid.classes()

    expect(container?.classList).toContain('mx-auto')
    expect(container?.classList).toContain('max-w-(--ui-container)')
    expect(container?.classList).not.toContain('lg:max-w-3xl')
    expect(classes).not.toContain('max-w-(--ui-container)')

    for (const name of expected) expect(classes).toContain(name)
    expect(classes).toContain('lg:max-w-3xl')
    expect(classes).not.toContain('flex')
    expect(classes.some(name => name.startsWith('text-'))).toBe(false)
    wrapper.unmount()
  })
  it('does not add a container when disabled', async () => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: { container: false, width: 'md', gridItems: {}, align: { justify: 'end' } },
      slots: { default: '<p>Content</p>' },
    })

    expect(wrapper.findAll('div')).toHaveLength(1)
    expect(wrapper.get('.grid').classes()).toContain('ms-auto')
    expect(wrapper.get('.grid').classes()).not.toContain('max-w-(--ui-container)')
    wrapper.unmount()
  })
})
