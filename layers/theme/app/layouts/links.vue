<script setup lang="ts">
import type { AppContextSiteInfo } from '#stir/composables/useAppContext'
import type { SocialIcon } from '#stir/types'

const { getPage } = useStirDrupalCe()
const page = getPage()
const { hasEditorialAccess } = usePageContext()
const { linkHub } = useAppConfig().stirTheme
const { iconsSocialConfig } = useSocialIcons()

const pageSiteInfo = computed<AppContextSiteInfo | undefined>(() =>
  page.value?.site_info && typeof page.value.site_info === 'object'
    ? page.value.site_info as AppContextSiteInfo
    : undefined,
)

const {
  data: appContext,
  execute: loadAppFooterContext,
} = await useAppFooterContext({ immediate: false })

if (!pageSiteInfo.value) {
  await loadAppFooterContext()
}

watch(pageSiteInfo, (siteInfo) => {
  if (!siteInfo) {
    void loadAppFooterContext()
  }
})

const siteInfo = computed<AppContextSiteInfo | undefined>(() =>
  pageSiteInfo.value ?? appContext.value?.site_info,
)
const socialIcons = computed<SocialIcon[]>(() =>
  Array.isArray(iconsSocialConfig.value) ? iconsSocialConfig.value : [],
)
const email = computed(() => siteInfo.value?.mail?.trim() || '')
const hasContact = computed(() => socialIcons.value.length > 0 || Boolean(email.value))
const homeLabel = computed(() =>
  siteInfo.value?.name
    ? `Visit ${siteInfo.value.name} home page`
    : 'Visit home page',
)
</script>

<template>
  <div :class="linkHub.root">
    <LazyDrupalTabs v-if="hasEditorialAccess" />

    <UMain
      id="main-content"
      as="main"
      :class="linkHub.main"
      role="main"
      tabindex="-1"
    >
      <UContainer :class="linkHub.container">
        <NuxtLink
          :aria-label="homeLabel"
          :class="linkHub.logoLink"
          to="/"
        >
          <AppLogo :add-classes="linkHub.logo" />
        </NuxtLink>

        <div :class="linkHub.content">
          <slot />
        </div>

        <div v-if="hasContact" :class="linkHub.contact">
          <nav
            v-if="socialIcons.length"
            aria-label="Social media"
            :class="linkHub.socials"
          >
            <IconsSocial
              v-for="(icon, index) in socialIcons"
              :key="String(icon.url || icon.title || index)"
              v-bind="icon"
            />
          </nav>

          <ULink
            v-if="email"
            :class="linkHub.email"
            raw
            :to="`mailto:${email}`"
          >
            {{ email }}
          </ULink>
        </div>
      </UContainer>
    </UMain>
  </div>
</template>
