import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import {
  UButton,
  UNavigationMenu,
  USelect,
  USkeleton,
  UTheme,
} from '#components'
import {
  adminUiProps,
  adminUiTheme,
} from '../../../layers/editorial/app/utils/adminUiTheme'

const AdminNavigation = defineComponent({
  components: { UButton, UNavigationMenu, USelect, USkeleton, UTheme },
  setup() {
    return {
      adminUiTheme,
      adminUiProps,
      items: [{ label: 'Content', to: '/admin/content' }],
    }
  },
  template: `
    <UTheme :props="adminUiProps" :ui="adminUiTheme">
      <UNavigationMenu :items="items" />
      <USelect :items="['One']" />
      <UButton label="Admin action" />
      <USkeleton />
    </UTheme>
  `,
})

describe('adminUiTheme', () => {
  it('applies shared navigation classes through UTheme', async () => {
    const wrapper = await mountSuspended(AdminNavigation)

    expect(wrapper.find('.admin-ui-nav-root').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-scope').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-popover-control').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-btn-base').classes()).toContain('text-xs')
    expect(wrapper.find('.admin-ui-skeleton').exists()).toBe(true)
  })
})
