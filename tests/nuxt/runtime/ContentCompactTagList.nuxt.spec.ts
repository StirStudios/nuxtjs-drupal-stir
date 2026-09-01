import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCompactTagList from '../../../layers/theme/app/components/Content/CompactTagList.vue'

describe('ContentCompactTagList (Nuxt runtime)', () => {
  it('keeps linked taxonomy targets at least 24px tall', async () => {
    const wrapper = await mountSuspended(ContentCompactTagList, {
      props: {
        items: [
          { id: 1, label: 'Performances', url: '/performances' },
          { id: 2, label: 'Editorial' },
        ],
      },
    })

    expect(wrapper.get('a').classes()).toEqual(expect.arrayContaining([
      'inline-flex',
      'min-h-6',
      'items-center',
    ]))
  })
})
