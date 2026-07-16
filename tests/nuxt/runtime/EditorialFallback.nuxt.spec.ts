import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DrupalTabsFallback from '../../../layers/theme/app/components/Drupal/Tabs.vue'
import EditLinkFallback from '../../../layers/theme/app/components/Edit/Link.vue'

describe('minimal editorial fallbacks', () => {
  it('renders EditLink content directly without controls or a shell', async () => {
    const wrapper = await mountSuspended(EditLinkFallback, {
      props: {
        link: 'https://cms.example/node/1/edit',
        showQuickEdit: true,
      },
      slots: {
        default: '<span>Public content</span>',
      },
    })

    expect(wrapper.find('span').text()).toBe('Public content')
    expect(wrapper.find('div').exists()).toBe(false)
    expect(wrapper.find('[data-admin-ui-controls]').exists()).toBe(false)
  })

  it('renders no local-task markup when DrupalTabs has no slot', async () => {
    const wrapper = await mountSuspended(DrupalTabsFallback)

    expect(wrapper.html()).toBe('')
  })
})
