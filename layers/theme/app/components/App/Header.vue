<script lang="ts" setup>
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{ mode?: 'fixed' | 'static' }>()
const attrs = useAttrs()
const {
  headerClasses,
  headerContainerClasses,
  headerHighlightColor,
  headerNavColor,
  headerNavVariant,
  headerRightClasses,
  headerUi,
  isAdministrator,
  logoClasses,
  menuBodyClasses,
  menuContent,
  menuContentClasses,
  menuHeaderClasses,
  menuId,
  menuOpen,
  menuOverlayClasses,
  menuSide,
  menuToggleSide,
  navLinks,
  showColorModeToggle,
  siteTitle,
  theme,
  toggleClasses,
  toggleIcon,
} = await useAppHeaderShell({
  mode: computed(() => props.mode),
})
</script>

<template>
  <LazyRegionArea area="top" />
  <LazyDrupalTabs v-if="isAdministrator" />

  <header
    v-bind="attrs"
    aria-label="Site header"
    :class="headerClasses"
    data-slot="root"
  >
    <UContainer
      :class="headerContainerClasses"
      data-slot="container"
    >
      <div
        :class="headerUi.left"
        data-slot="left"
      >
        <UButton
          v-if="menuToggleSide === 'left'"
          :aria-controls="menuId"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :class="toggleClasses"
          color="neutral"
          data-slot="toggle"
          :icon="toggleIcon"
          variant="ghost"
          @click="menuOpen = !menuOpen"
        />

        <ULink
          aria-label="Home"
          :class="headerUi.title"
          data-slot="title"
          to="/"
        >
          <AppLogo
            v-if="theme.navigation.logo"
            :add-classes="logoClasses"
          />
          <template v-else>
            {{ siteTitle }}
          </template>
        </ULink>
      </div>

      <div
        :class="headerUi.center"
        data-slot="center"
      >
        <LazyUNavigationMenu
          aria-label="Site Navigation"
          class="app-nav app-nav-desktop"
          :color="headerNavColor"
          :highlight="theme.navigation.highlight.show"
          :highlight-color="headerHighlightColor"
          :items="navLinks"
          :variant="headerNavVariant"
        />
      </div>

      <div
        :class="headerRightClasses"
        data-slot="right"
      >
        <LazyIconsColorMode v-if="showColorModeToggle" />

        <UButton
          v-if="menuToggleSide === 'right'"
          :aria-controls="menuId"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :class="toggleClasses"
          color="neutral"
          data-slot="toggle"
          :icon="toggleIcon"
          variant="ghost"
          @click="menuOpen = !menuOpen"
        />
      </div>
    </UContainer>
  </header>

  <LazyUSlideover
    v-if="menuOpen"
    v-model:open="menuOpen"
    :content="menuContent as never"
    description="Site navigation"
    :side="menuSide"
    title="Navigation"
    :ui="{
      overlay: menuOverlayClasses,
      content: menuContentClasses,
    }"
  >
    <template #content>
      <LazyAppHeaderOverlayHeader
        :header-class="menuHeaderClasses"
        :left-class="headerUi.left"
        :logo-classes="logoClasses"
        :menu-id="menuId"
        :right-class="headerRightClasses"
        :show-color-mode-toggle="showColorModeToggle"
        :show-logo="Boolean(theme.navigation.logo)"
        :site-title="siteTitle"
        :title-class="headerUi.title"
        :toggle-class="toggleClasses"
        :toggle-icon="toggleIcon"
        @close="menuOpen = false"
      />

      <LazyAppHeaderMobileMenu
        :body-class="menuBodyClasses"
        :items="navLinks"
        :link-class="theme.navigation.slideover.link"
      />
    </template>
  </LazyUSlideover>
</template>
