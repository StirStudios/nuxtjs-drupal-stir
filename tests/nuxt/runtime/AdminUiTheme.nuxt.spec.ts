import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { UNavigationMenu, UTheme } from '#components'
import { adminUiTheme } from '../../../layers/theme/app/utils/adminUiTheme'

const AdminNavigation = defineComponent({
  components: { UNavigationMenu, UTheme },
  setup() {
    return {
      adminUiTheme,
      items: [{ label: 'Content', to: '/admin/content' }],
    }
  },
  template: `
    <UTheme :ui="adminUiTheme">
      <UNavigationMenu :items="items" />
    </UTheme>
  `,
})

describe('adminUiTheme', () => {
  it('applies shared navigation classes through UTheme', async () => {
    const wrapper = await mountSuspended(AdminNavigation)

    expect(wrapper.find('.admin-ui-nav-root').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-scope').exists()).toBe(true)
  })
})
