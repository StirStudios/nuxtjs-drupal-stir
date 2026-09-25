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

const menu = vi.hoisted(() => ({ items: [] as Record<string, unknown>[] }))
const defaultMenu = [{ title: 'Work', url: '/work' }]

mockNuxtImport('useStirDrupalCe', () => () => ({
  getPage: () => ref({ site_info: { name: 'Example site' } }),
  useMenu: async () => ({ data: ref(menu.items) }),
}))

const navigation = () => useAppConfig().stirTheme.navigation as Record<string, unknown>
let originalNavigation: Record<string, unknown> = {}

function setNavigation(overrides: Record<string, unknown>) {
  Object.assign(navigation(), overrides)
}

// App config is reactive, so snapshot it as plain data. Tests only override
// keys that exist in the layer defaults.
beforeEach(() => {
  menu.items = defaultMenu
  originalNavigation = JSON.parse(JSON.stringify(navigation()))
})

afterEach(() => {
  Object.assign(navigation(), JSON.parse(JSON.stringify(originalNavigation)))
})

// The Nuxt UI slideover teleports its panel, so assert on the component itself.
const findSlideover = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.findComponent({ name: 'USlideover' })
const findOverlayHeader = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.findComponent({ name: 'AppHeaderOverlayHeader' })

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
    // Sites that show the slideover on desktop must keep its close button.
    await vi.waitFor(() => expect(findOverlayHeader(wrapper).exists()).toBe(true))
    expect(findOverlayHeader(wrapper).props('rightClass')).not.toContain('lg:hidden')
    await toggle.trigger('click')
    slideover.vm.$emit('after:leave')
    await nextTick()
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('shows the returned focus ring only after keyboard input', async () => {
    const wrapper = await mountSuspended(Header, { attachTo: document.body })
    const toggle = wrapper.get('[data-slot="right"] [data-slot="toggle"]')
    const focus = vi.spyOn(toggle.element as HTMLElement, 'focus')
    const closeWith = async (event: Event) => {
      document.dispatchEvent(event)
      await toggle.trigger('click')
      await vi.waitFor(() => expect(findSlideover(wrapper).exists()).toBe(true))
      await toggle.trigger('click')
      findSlideover(wrapper).vm.$emit('after:leave')
      await nextTick()
    }

    await closeWith(new Event('pointerdown'))
    expect(focus).toHaveBeenLastCalledWith({ focusVisible: false })
    await closeWith(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(focus).toHaveBeenLastCalledWith({ focusVisible: true })
    wrapper.unmount()
  })

  it('does not focus the toggle when a kept-mounted menu first renders closed', async () => {
    setNavigation({
      slideover: {
        ...(originalNavigation.slideover as Record<string, unknown>),
        portal: false,
        unmountOnHide: false,
      },
    })

    const wrapper = await mountSuspended(Header, { attachTo: document.body })
    const toggle = wrapper.get('[data-slot="right"] [data-slot="toggle"]')
    const focus = vi.spyOn(toggle.element as HTMLElement, 'focus')

    findSlideover(wrapper).vm.$emit('after:leave')
    await nextTick()
    expect(focus).not.toHaveBeenCalled()

    await toggle.trigger('click')
    await toggle.trigger('click')
    findSlideover(wrapper).vm.$emit('after:leave')
    await nextTick()
    expect(focus).toHaveBeenCalledTimes(1)
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
    expect(slideover.props('ui').overlay).toContain('stir-menu-overlay')
    expect(contentClasses).not.toContain('!bg-default')
    expect(contentClasses).not.toContain('lg:hidden')
    expect(wrapper.get('[data-test="toggle-icon"]').attributes('data-open')).toBe('false')
    await toggle.trigger('click')
    expect(wrapper.get('[data-test="toggle-icon"]').attributes('data-open')).toBe('true')
    wrapper.unmount()
  })

  it.each(['left', 'right'] as const)('keeps a %s toggle and its menu at every breakpoint in the toggle layout', async (side) => {
    const colorMode = useAppConfig().colorMode as Record<string, unknown>
    const showToggle = colorMode.showToggle

    // Without a colour-mode toggle or actions, the default layout hides the
    // right region from lg up; the toggle layout must not.
    colorMode.showToggle = false
    setNavigation({ desktopLayout: 'toggle', toggleDirection: side })

    const wrapper = await mountSuspended(Header, { attachTo: document.body })
    const toggle = wrapper.get(`[data-slot="${side}"] [data-slot="toggle"]`)

    expect(wrapper.findAll('[data-slot="toggle"]')).toHaveLength(1)
    expect(toggle.classes()).not.toContain('lg:hidden')
    expect(wrapper.get(`[data-slot="${side}"]`).classes()).not.toContain('lg:hidden')
    expect(toggle.classes()).toContain(side === 'left' ? '-ms-1.5' : '-me-1.5')
    expect(wrapper.find('[data-slot="center"]').exists()).toBe(false)
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'UNavigationMenu' }).exists()).toBe(false)
    expect(wrapper.find('[data-slot="title"]').exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    await vi.waitFor(() => expect(findSlideover(wrapper).exists()).toBe(true))
    const slideover = findSlideover(wrapper)

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-controls')).toBe(slideover.props('content').id)
    expect(slideover.props('side')).toBe(side)
    expect(slideover.props('ui').content).not.toContain('lg:hidden')
    expect(slideover.props('ui').overlay).not.toContain('lg:hidden')
    // The close button lives in the slideover header, which must stay visible
    // from lg up even when the colour-mode toggle is off or forced.
    await vi.waitFor(() => expect(findOverlayHeader(wrapper).exists()).toBe(true))
    const overlayHeader = findOverlayHeader(wrapper)
    const close = overlayHeader.get('button[aria-label="Close navigation menu"]')

    expect(overlayHeader.props('rightClass')).not.toContain('lg:hidden')
    expect(close.classes()).not.toContain('lg:hidden')
    expect(close.attributes('aria-controls')).toBe(toggle.attributes('aria-controls'))
    await toggle.trigger('click')
    slideover.vm.$emit('after:leave')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    colorMode.showToggle = showToggle
    wrapper.unmount()
  })

  it('hides the header brand without falling back to the site title', async () => {
    setNavigation({ desktopLayout: 'toggle', toggleDirection: 'left', brand: false })

    const wrapper = await mountSuspended(Header)

    expect(wrapper.find('[data-slot="title"]').exists()).toBe(false)
    expect(wrapper.find('.app-logo').exists()).toBe(false)
    expect(wrapper.get('header').text()).not.toContain('Example site')
    expect(wrapper.find('[data-slot="left"] [data-slot="toggle"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('falls back to the site title when only the logo is off', async () => {
    setNavigation({ logo: false })

    const wrapper = await mountSuspended(Header)

    expect(wrapper.get('[data-slot="title"]').text()).toBe('Example site')
    wrapper.unmount()
  })

  it('ignores project component names that are not registered', async () => {
    setNavigation({ desktopLayout: 'centered-toggle', actionsComponent: 'MissingHeaderActions', toggleComponent: 'MissingToggle' })

    const wrapper = await mountSuspended(Header)

    expect(wrapper.get('[data-slot="right"]').text()).toBe('')
    expect(wrapper.find('[data-slot="toggle"] [data-slot="leadingIcon"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('applies the configured dropdown orientation to desktop menus', async () => {
    setNavigation({ contentOrientation: 'vertical' })

    const wrapper = await mountSuspended(Header)

    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'UNavigationMenu' }).exists()).toBe(true))

    expect(wrapper.findComponent({ name: 'UNavigationMenu' }).props('contentOrientation')).toBe('vertical')
    wrapper.unmount()
  })

  it('keeps the default right region free of action items', async () => {
    const wrapper = await mountSuspended(Header)
    const right = wrapper.get('[data-slot="right"]')

    expect(right.find('[data-slot="action"]').exists()).toBe(false)
    expect(right.find('.app-nav-actions').exists()).toBe(false)
    expect(wrapper.findAll('.app-nav-desktop')).toHaveLength(1)
    wrapper.unmount()
  })

  it('routes configured menu items into header actions with mobile parity and focus return', async () => {
    const colorMode = useAppConfig().colorMode as Record<string, unknown>
    const showToggle = colorMode.showToggle

    colorMode.showToggle = false
    menu.items = [
      { title: 'Classes', url: '/classes' },
      { title: 'Join now', url: '/pricing' },
      { title: 'Account', url: '/account', children: [{ title: 'Sign in', url: '/auth/login' }] },
    ]
    setNavigation({
      actionItems: [
        { match: -2, as: 'button', mobile: 'button', color: 'secondary', class: 'uppercase' },
        { match: 'Account' },
      ],
    })

    const wrapper = await mountSuspended(Header, { attachTo: document.body })
    const right = wrapper.get('[data-slot="right"]')
    const cta = right.get('[data-slot="action"]')
    const primaryNav = wrapper.get('nav[aria-label="Site Navigation"]')
    const actionNav = right.get('nav[aria-label="Secondary navigation"]')

    expect(right.classes()).not.toContain('lg:hidden')
    expect(cta.text()).toBe('Join now')
    expect(cta.attributes('href')).toBe('/pricing')
    expect(cta.classes()).toEqual(expect.arrayContaining(['hidden', 'lg:inline-flex', 'uppercase']))
    expect(primaryNav.text()).toContain('Classes')
    expect(primaryNav.text()).not.toMatch(/Join now|Account/)
    expect(actionNav.classes()).toEqual(expect.arrayContaining(['app-nav-actions', 'hidden', 'lg:flex']))
    expect(actionNav.text()).toContain('Account')
    expect(actionNav.text()).not.toContain('Join now')

    const toggle = right.get('[data-slot="toggle"]')

    await toggle.trigger('click')
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'AppHeaderMobileMenu' }).exists()).toBe(true))
    const mobileMenu = wrapper.findComponent({ name: 'AppHeaderMobileMenu' })

    expect(mobileMenu.props('items').map((item: { label: string }) => item.label)).toEqual(['Classes', 'Account'])
    expect(mobileMenu.props('actions').map((action: { item: { label: string } }) => action.item.label)).toEqual(['Join now'])
    await toggle.trigger('click')
    findSlideover(wrapper).vm.$emit('after:leave')
    await nextTick()
    expect(document.activeElement).toBe(toggle.element)
    colorMode.showToggle = showToggle
    wrapper.unmount()
  })
})
