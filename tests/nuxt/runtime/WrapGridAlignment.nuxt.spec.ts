import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import WrapGrid from '../../../layers/theme/app/components/Wrap/Grid.vue'

describe('layout container alignment', () => {
  it.each([
    { align: undefined, expected: ['mx-auto'] },
    { align: 'md:flex justify-start', expected: ['ms-0', 'me-auto'] },
    { align: 'md:flex justify-center', expected: ['mx-auto'] },
    { align: 'md:flex justify-end', expected: ['ms-auto', 'me-0'] },
  ])('positions the container for $align without aligning its text', async ({ align, expected }) => {
    const wrapper = await mountSuspended(WrapGrid, {
      props: { container: true, width: 'max-w-3xl', gridItems: 'grid grid-cols-2', align },
      slots: { default: '<p>First</p><p>Second</p>' },
    })

    const classes = wrapper.get('.grid').classes()

    for (const name of expected) expect(classes).toContain(name)
    expect(classes).toContain('max-w-3xl')
    expect(classes).not.toContain('flex')
    expect(classes.some(name => name.startsWith('text-'))).toBe(false)
    wrapper.unmount()
  })
})
