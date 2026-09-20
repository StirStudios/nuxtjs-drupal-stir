import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useAppConfig } from '#imports'
import NodePage from '../../../layers/theme/app/components/global/node--page.vue'
import FieldEntityReference from '../../../layers/theme/app/components/global/field-entity-reference.vue'

describe('NodePage (Nuxt runtime)', () => {
  it('renders configured page content without exposing ownership metadata', async () => {
    const wrapper = await mountSuspended(NodePage, {
      attrs: {
        'show-before-main': false,
      },
      slots: {
        section: '<section>Page content</section>',
        uid: FieldEntityReference,
      },
    })

    expect(wrapper.text()).toContain('Page content')
    expect(wrapper.text()).not.toContain('field-entity-reference')
  })

  it('renders article pages through the layer, not an empty wrapper', async () => {
    const wrapper = await mountSuspended(NodePage, {
      attrs: {
        'is-article': true,
        'show-before-main': false,
      },
      slots: {
        section: '<section>Article body</section>',
      },
    })

    expect(wrapper.find('article').text()).toContain('Article body')
  })

  it('wraps page content in the configured class, and adds nothing without one', async () => {
    const theme = useAppConfig().stirTheme

    expect(await mountPageContent()).not.toContain('pb-8')

    theme.node.pageContentClass = 'pb-8'
    try {
      expect(await mountPageContent()).toContain('pb-8')
    }
    finally {
      theme.node.pageContentClass = ''
    }
  })
})

async function mountPageContent(): Promise<string> {
  const wrapper = await mountSuspended(NodePage, {
    attrs: { 'show-before-main': false },
    slots: { section: '<section>Page content</section>' },
  })

  return wrapper.html()
}
