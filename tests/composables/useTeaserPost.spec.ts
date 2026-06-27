import { describe, expect, it } from 'vitest'

import { useTeaserPost } from '../../layers/theme/app/composables/useTeaserPost'

describe('useTeaserPost', () => {
  it('prefers explicit node editLink over source editLink', () => {
    const { post } = useTeaserPost(
      {
        props: {
          editLink: 'https://cms.local/stir_layout_builder/node/1/paragraphs/999/edit',
        },
      },
      {
        editLink: 'https://cms.local/node/15/edit',
      },
    )

    expect(post.value.editLink).toBe('https://cms.local/node/15/edit')
  })

  it('falls back to source editLink when node editLink is not provided', () => {
    const { post } = useTeaserPost(
      {
        props: {
          editLink: 'https://cms.local/stir_layout_builder/node/1/paragraphs/999/edit',
        },
      },
      {
        url: '/node/15',
      },
    )

    expect(post.value.editLink).toBe(
      'https://cms.local/stir_layout_builder/node/1/paragraphs/999/edit',
    )
  })

  it('returns undefined when no explicit edit link exists', () => {
    const { post } = useTeaserPost(
      {},
      {
        title: 'No Link Teaser',
      },
    )

    expect(post.value.editLink).toBeUndefined()
  })
})
