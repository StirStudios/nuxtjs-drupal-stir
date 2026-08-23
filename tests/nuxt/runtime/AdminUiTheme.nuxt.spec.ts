import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { UNavigationMenu, USelect, UTheme } from '#components'
import { adminUiTheme } from '../../../layers/editorial/app/utils/adminUiTheme'

const AdminNavigation = defineComponent({
  components: { UNavigationMenu, USelect, UTheme },
  setup() {
    return {
      adminUiTheme,
      items: [{ label: 'Content', to: '/admin/content' }],
    }
  },
  template: `
    <UTheme :ui="adminUiTheme">
      <UNavigationMenu :items="items" />
      <USelect :items="['One']" />
    </UTheme>
  `,
})

describe('adminUiTheme', () => {
  it('applies shared navigation classes through UTheme', async () => {
    const wrapper = await mountSuspended(AdminNavigation)

    expect(wrapper.find('.admin-ui-nav-root').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-scope').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-popover-control').exists()).toBe(true)
  })
})
