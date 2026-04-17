<script lang="ts" setup>
import { useScrollNav } from '~/composables/useScrollNav'
import { usePageContext } from '~/composables/usePageContext'

const props = defineProps<{ mode?: 'fixed' | 'static' }>()
const { scrollDirection, atBottom, isScrolled } = useScrollNav()
const { fetchMenu, getPage } = useDrupalCe()
const page = getPage()
const { isFront, isAdministrator } = usePageContext()
const route = useRoute()
const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const hydrated = ref(false)
const forceScrolled = ref(false)
const slideoverMotionContent = computed(() => {
  const angleEnabled = Boolean(theme.navigation.slideover?.angle)

  if (!angleEnabled) return { 'aria-label': 'Site navigation menu' }

  const sideToken = theme.navigation.toggleDirection === 'left' ? 'left' : 'right'
  const className = [
    'menu-panel-motion menu-panel-angle !bg-transparent !divide-y-0 !ring-0 !shadow-none sm:!ring-0 sm:!shadow-none',
    `data-[state=open]:animate-[slide-in-from-${sideToken}_780ms_cubic-bezier(0.03,0.9,0.16,1)]`,
    `data-[state=closed]:animate-[slide-out-to-${sideToken}_780ms_cubic-bezier(0.84,0,0.97,0.1)_120ms]`,
  ].join(' ')

  const degRaw = Number(theme.navigation.slideover?.angleDeg ?? 55)
  const offsetRaw = Number(theme.navigation.slideover?.angleOffsetX ?? 175)
  const angleDeg = Number.isFinite(degRaw) ? degRaw : 55
  const angleOffsetX = Number.isFinite(offsetRaw) ? offsetRaw : 175

  if (angleDeg === 55 && angleOffsetX === 175) {
    return {
      'aria-label': 'Site navigation menu',
      class: className,
    }
  }

  return {
    'aria-label': 'Site navigation menu',
    class: className,
    style: {
      '--menu-angle-deg': `${angleDeg}deg`,
      '--menu-angle-offset-x': `${angleOffsetX}%`,
    },
  }
})

// Fetch menu items
const mainMenu = await fetchMenu('main')

type MainMenuItem = {
  title?: string
  external?: boolean
  absolute?: string
  alias?: string
  options?: {
    fragment?: string
  }
}
const navLinks = computed(() =>
  mainMenu.value.map((item: MainMenuItem) => ({
    label: item.title ?? '',
    to: item.external
      ? (item.absolute ?? '')
      : `/${item.alias ?? ''}${item.options?.fragment ? `#${item.options.fragment}` : ''}`,
  })),
)

const finalIsScrolled = computed(() => {
  if (!hydrated.value) return false
  return isScrolled.value || forceScrolled.value
})

const isFixed = computed(() => {
  if (props.mode === 'fixed') return true
  return isFront.value || finalIsScrolled.value
})

const headerRootClasses = computed(() => {
  const shouldHide =
    isFixed.value &&
    ((isFront.value && !finalIsScrolled.value && theme.navigation.isHidden) ||
      (finalIsScrolled.value &&
        scrollDirection.value === 'down' &&
        !atBottom.value))

  return [
    theme.navigation.base,
    isFixed.value
      ? [
          'fixed z-50 w-full',
          isAdministrator.value && !shouldHide ? 'top-[3.1rem]' : 'top-0',
        ]
      : 'relative w-full',
    theme.navigation.transparentTop && !finalIsScrolled.value
      ? 'bg-transparent backdrop-none border-none backdrop-blur-none'
      : theme.navigation.background,
    {
      'is-scrolled': finalIsScrolled.value,
      '-translate-y-full': shouldHide,
    },
  ]
})

onMounted(() => {
  hydrated.value = true
})

watch(
  () => route.hash,
  (hash) => {
    forceScrolled.value = Boolean(hash)
  },
  { immediate: true },
)

// Fix: blur active element when slideover opens (prevents aria-hidden focus warning)
const onOpen = (val: boolean) => {
  if (val && import.meta.client)
    (document.activeElement as HTMLElement | null)?.blur()
}
</script>

<template>
  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />

  <LazyUHeader
    aria-label="Site header"
    :menu="{
      side: theme.navigation.toggleDirection,
      content: slideoverMotionContent,
    }"
    :mode="theme.navigation.toggleType"
    :title="page?.site_info?.name ?? ''"
    :to="'/'"
    :toggle-side="theme.navigation.toggleDirection"
    :ui="{
      root: headerRootClasses,
      container: theme.navigation.container,
      header: theme.navigation.header,
      body: theme.navigation.slideover.body,
      right:
        appConfig.colorMode?.forced || appConfig.colorMode?.showToggle === false
        ? 'block lg:hidden lg:flex-0'
        : 'lg:flex-1',
    }"
    @update:open="onOpen"
  >
    <template #title>
      <LazyAppLogo
        v-if="theme.navigation.logo"
        :add-classes="
          [
            'app-logo',
            'transition-all duration-300',
            finalIsScrolled
              ? theme.navigation.logoScrolledSize || theme.navigation.logoSize
              : theme.navigation.logoSize,
          ].join(' ')
        "
      />
      <template v-else>
        {{ page?.site_info?.name }}
      </template>
    </template>

    <LazyUNavigationMenu
      aria-label="Site Navigation"
      class="app-nav app-nav-desktop"
      :color="theme.navigation.color"
      :highlight="theme.navigation.highlight.show"
      :highlight-color="
        theme.navigation.highlight.show ? theme.navigation.highlight.color : ''
      "
      :items="navLinks"
      :variant="theme.navigation.variant"
    />

    <template v-if="appConfig.colorMode?.showToggle !== false" #right>
      <LazyIconsColorMode />
    </template>

    <template #body>
      <LazyUNavigationMenu
        aria-label="Mobile Navigation"
        class="app-nav app-nav-mobile"
        :items="navLinks"
        orientation="vertical"
        :ui="{ link: theme.navigation.slideover.link }"
      />
    </template>
  </LazyUHeader>
</template>
