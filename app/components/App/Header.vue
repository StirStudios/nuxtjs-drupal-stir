<script lang="ts" setup>
import { useScrollNav } from '~/composables/useScrollNav'
import { usePageContext } from '~/composables/usePageContext'

const props = defineProps<{ mode?: 'fixed' | 'static' }>()
const { scrollDirection, atBottom, isScrolled } = useScrollNav()
const { page, isFront, isAdministrator } = usePageContext()
const { fetchMenu } = useDrupalCe()
const route = useRoute()
const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const hydrated = ref(false)
const forceScrolled = ref(false)
const isFixed = computed(() => {
  if (props.mode === 'fixed') return true
  if (props.mode === 'static') return false
  return isFront.value
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
const navLinks = mainMenu.value.map((item: MainMenuItem) => ({
  label: item.title ?? '',
  to: item.external
    ? (item.absolute ?? '')
    : `/${item.alias ?? ''}${item.options?.fragment ? `#${item.options.fragment}` : ''}`,
}))

const finalIsScrolled = computed(() => {
  if (!hydrated.value) return false
  return isScrolled.value || forceScrolled.value
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
  <LazyUHeader
    aria-label="Site header"
    :menu="{
      content: {
        'aria-label': 'Site navigation menu',
      },
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
            'transition-all duration-300',
            finalIsScrolled
              ? theme.navigation.logoScrolledSize || theme.navigation.logoSize
              : theme.navigation.logoSize,
          ].join(' ')
        "
        class="app-logo"
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
