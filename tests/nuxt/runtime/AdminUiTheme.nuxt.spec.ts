import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import {
  UApp,
  UButton,
  UModal,
  UNavigationMenu,
  USelect,
  USkeleton,
  UTheme,
  UTooltip,
} from '#components'
import {
  adminUiProps,
  adminUiTheme,
} from '../../../layers/editorial/app/utils/adminUiTheme'

const AdminNavigation = defineComponent({
  components: {
    UApp,
    UButton,
    UModal,
    UNavigationMenu,
    USelect,
    USkeleton,
    UTheme,
    UTooltip,
  },
  setup() {
    return {
      adminUiTheme,
      adminUiProps,
      items: [{ label: 'Content', to: '/admin/content' }],
    }
  },
  template: `
    <UApp>
      <UTheme :props="adminUiProps" :ui="adminUiTheme">
        <UNavigationMenu :items="items" />
        <USelect :items="['One']" />
        <UButton label="Admin action" />
        <USkeleton />
        <UTooltip :open="true" text="Admin help">
          <UButton label="Help" />
        </UTooltip>
        <UModal :open="true" title="Admin modal">
          <template #body>Admin modal body</template>
        </UModal>
      </UTheme>
    </UApp>
  `,
})

describe('adminUiTheme', () => {
  it('applies shared navigation classes through UTheme', async () => {
    const wrapper = await mountSuspended(AdminNavigation)

    expect(wrapper.find('.admin-ui-nav-root').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-scope').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-popover-control').exists()).toBe(true)
    expect(wrapper.find('.admin-ui-btn-base').classes()).toContain('text-xs')
    expect(adminUiTheme.card.header).toBe('admin-ui-card-header')
    expect(adminUiTheme.card.body).toBe('p-3')
    expect(adminUiTheme.switch.base).toBe('admin-ui-switch-track')
    expect(adminUiTheme.switch.thumb).toBe('admin-ui-switch-thumb')
    expect(wrapper.find('.admin-ui-skeleton').exists()).toBe(true)
    expect(document.querySelector('.admin-ui-tooltip-content')).not.toBeNull()
    expect(document.querySelector('.admin-ui-tooltip-text')).not.toBeNull()
    expect(document.querySelector('.admin-ui-modal-overlay')).not.toBeNull()
    expect(document.querySelector('.admin-ui-modal')).not.toBeNull()
  })
})
