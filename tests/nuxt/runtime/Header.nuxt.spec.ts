import { useAppConfig, useNuxtApp } from '#imports'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import Header from '../../../layers/theme/app/components/App/Header.vue'

mockNuxtImport('useScrollNav', () => () => ({
  scrollDirection: ref('up'),
  atBottom: ref(false),
  isScrolled: ref(false),
}))

mockNuxtImport('usePageContext', () => () => ({
  isFront: ref(false),
  hasEditorialAccess: ref(false),
}))

mockNuxtImport('useStirDrupalCe', () => () => ({
  getPage: () => ref({ site_info: { name: 'Example site' } }),
  useMenu: async () => ({ data: ref([{ title: 'Work', url: '/work' }]) }),
}))

const navigation = () => useAppConfig().stirTheme.navigation as Record<string, unknown>
let originalNavigation: Record<string, unknown> = {}

function setNavigation(overrides: Record<string, unknown>) {
  Object.assign(navigation(), overrides)
}

// App config is reactive, so snapshot it as plain data. Tests only override
// keys that exist in the layer defaults.
beforeEach(() => {
  originalNavigation = JSON.parse(JSON.stringify(navigation()))
})

afterEach(() => {
  Object.assign(navigation(), JSON.parse(JSON.stringify(originalNavigation)))
})

// The Nuxt UI slideover teleports its panel, so assert on the component itself.
const findSlideover = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.findComponent({ name: 'USlideover' })

describe('App header', () => {
  it('keeps the default mobile toggle and returns focus after the visitor closes the menu', async () => {
    const wrapper = await mountSuspended(Header, { attachTo: document.body })
    const toggle = wrapper.get('[data-slot="right"] [data-slot="toggle"]')

    expect(toggle.classes()).toContain('lg:hidden')
    expect(wrapper.find('.app-nav-desktop').exists()).toBe(true)
    expect(findSlideover(wrapper).exists()).toBe(false)

    await toggle.trigger('click')
    // The lazy slideover resolves asynchronously on first open.
    await vi.waitFor(() => expect(findSlideover(wrapper).exists()).toBe(true))
    const slideover = findSlideover(wrapper)

    expect(slideover.props()).toMatchObject({ open: true, portal: true, overlay: true, unmountOnHide: true })
    expect(slideover.props('ui').content).toContain('lg:hidden')
    await toggle.trigger('click')
    slideover.vm.$emit('after:leave')
    await nextTick()
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('renders a centred toggle layout with project toggle, actions and panel classes', async () => {
    const nuxtApp = useNuxtApp()

    nuxtApp.vueApp.component('TestHeaderToggleIcon', defineComponent({
      props: { open: Boolean, scrolled: Boolean },
      setup: props => () => h('span', { 'data-test': 'toggle-icon', 'data-open': String(props.open) }),
    }))
    nuxtApp.vueApp.component('TestHeaderActions', defineComponent({
      props: { scrolled: Boolean },
      setup: props => () => h('a', { 'data-test': 'actions', 'data-scrolled': String(props.scrolled) }, 'Contact'),
    }))
    setNavigation({
      desktopLayout: 'centered-toggle',
      toggleComponent: 'TestHeaderToggleIcon',
      actionsComponent: 'TestHeaderActions',
      toggleClass: 'project-toggle',
      slideover: {
        ...(originalNavigation.slideover as Record<string, unknown>),
        angle: true,
        content: 'project-panel',
        portal: false,
        overlay: false,
        unmountOnHide: false,
      },
    })

    const wrapper = await mountSuspended(Header)
    const toggle = wrapper.get('[data-slot="center"] [data-slot="toggle"]')
    const slideover = findSlideover(wrapper)
    const contentClasses = slideover.props('ui').content as string

    expect(wrapper.get('[data-slot="container"]').classes()).toContain('grid')
    expect(wrapper.find('.app-nav-desktop').exists()).toBe(false)
    expect(wrapper.findAll('[data-slot="toggle"]')).toHaveLength(1)
    expect(toggle.classes()).not.toContain('lg:hidden')
    expect(toggle.classes()).toContain('project-toggle')
    expect(wrapper.get('[data-slot="right"] [data-test="actions"]').attributes('data-scrolled')).toBe('false')
    expect(slideover.props()).toMatchObject({ open: false, portal: false, overlay: false, unmountOnHide: false })
    expect(contentClasses).toContain('project-panel')
    expect(contentClasses).toContain('stir-menu-panel')
    expect(contentClasses).not.toContain('!bg-default')
    expect(contentClasses).not.toContain('lg:hidden')
    expect(wrapper.get('[data-test="toggle-icon"]').attributes('data-open')).toBe('false')
    await toggle.trigger('click')
    expect(wrapper.get('[data-test="toggle-icon"]').attributes('data-open')).toBe('true')
    wrapper.unmount()
  })

  it('ignores project component names that are not registered', async () => {
    setNavigation({ desktopLayout: 'centered-toggle', actionsComponent: 'MissingHeaderActions', toggleComponent: 'MissingToggle' })

    const wrapper = await mountSuspended(Header)

    expect(wrapper.get('[data-slot="right"]').text()).toBe('')
    expect(wrapper.find('[data-slot="toggle"] [data-slot="leadingIcon"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
