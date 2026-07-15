<script setup lang="ts">
import FooterAtomList from '~/components/App/Footer/AtomList.vue'
import type {
  AppContextFooterMenuItem,
  AppContextSiteInfo,
} from '~/composables/useAppContext'
import type { SocialIcon } from '~/types'
import {
  resolveFooterConfig,
  toThemeRecord,
  type FooterAtomVisibility,
  type FooterSections,
} from '~/utils/footer'

const { getPage } = useStirDrupalCe()
const page = getPage()
const { iconsSocialConfig } = useSocialIcons()
const currentYear = new Date().getFullYear()

const theme = computed(() => toThemeRecord(useAppConfig().stirTheme))
const themeNavigation = computed(() => toThemeRecord(theme.value.navigation))
const themeContainer = computed(() =>
  typeof theme.value.container === 'string' ? theme.value.container.trim() : '',
)
const footerConfig = computed(() =>
  resolveFooterConfig(theme.value.footer, themeNavigation.value),
)

const {
  data: appContext,
  execute: loadAppFooterContext,
} = await useAppFooterContext({ immediate: false })

const socialIcons = computed<SocialIcon[]>(() => Array.isArray(iconsSocialConfig.value) ? [...iconsSocialConfig.value] : [])

const pageFooterMenu = computed<AppContextFooterMenuItem[] | undefined>(() =>
  Array.isArray(page.value?.footer_menu) ? page.value?.footer_menu as AppContextFooterMenuItem[] : undefined,
)
const pageSiteInfo = computed<AppContextSiteInfo | undefined>(() =>
  page.value?.site_info && typeof page.value.site_info === 'object'
    ? page.value.site_info as AppContextSiteInfo
    : undefined,
)

const needsAppContext = computed(() => !pageFooterMenu.value || !pageSiteInfo.value)

if (needsAppContext.value) {
  await loadAppFooterContext()
}
watch(needsAppContext, (active) => {
  if (active) {
    void loadAppFooterContext()
  }
})

const footerMenu = computed<AppContextFooterMenuItem[]>(() => {
  if (Array.isArray(pageFooterMenu.value)) {
    return pageFooterMenu.value
  }

  return Array.isArray(appContext.value?.footer_menu) ? appContext.value.footer_menu : []
})

const siteInfo = computed<AppContextSiteInfo | undefined>(() =>
  pageSiteInfo.value ?? appContext.value?.site_info,
)

const footerMenuItems = computed(() =>
  footerMenu.value.map((item) => ({ label: item.title || '', to: item.url || '' })),
)

const showLogo = computed(() => footerConfig.value.showLogo && themeNavigation.value.logo !== false)
const canRenderAtom = computed<FooterAtomVisibility>(() => {
  const hasSiteName = Boolean(siteInfo.value?.name)

  return {
    logo: showLogo.value,
    menu: footerConfig.value.showMenu && footerMenuItems.value.length > 0,
    socials: footerConfig.value.showSocials && socialIcons.value.length > 0,
    slogan: footerConfig.value.showSlogan && Boolean(siteInfo.value?.slogan),
    email: footerConfig.value.showEmail && Boolean(siteInfo.value?.mail),
    legal: (footerConfig.value.showCopyright || footerConfig.value.showPoweredBy)
      && hasSiteName,
    copyright: footerConfig.value.showCopyright && hasSiteName,
    poweredBy: footerConfig.value.showPoweredBy,
  }
})
const footerSections = computed<FooterSections>(() => ({
  left: footerConfig.value.sections.left.filter((atom) => canRenderAtom.value[atom]),
  center: footerConfig.value.sections.center.filter((atom) => canRenderAtom.value[atom]),
  right: footerConfig.value.sections.right.filter((atom) => canRenderAtom.value[atom]),
}))

const stackedLayout = computed(() => footerConfig.value.layout === 'stacked')
const hasLeft = computed(() => footerSections.value.left.length > 0 && !stackedLayout.value)
const hasRight = computed(() => footerSections.value.right.length > 0 && !stackedLayout.value)
const hasCenter = computed(() => footerSections.value.center.length > 0)
const toMailto = computed(() => (siteInfo.value?.mail ? `mailto:${siteInfo.value.mail}` : undefined))

const footerAtomProps = computed(() => ({
  config: footerConfig.value,
  menuItems: footerMenuItems.value,
  siteInfo: siteInfo.value,
  socialIcons: socialIcons.value,
  showCopyright: footerConfig.value.showCopyright,
  showPoweredBy: footerConfig.value.showPoweredBy,
  showLogo: showLogo.value,
  toMail: toMailto.value,
  year: currentYear,
}))

const footerContainerClass = computed(() => [themeContainer.value, footerConfig.value.container].filter(Boolean).join(' '))
const footerSectionClasses = computed(() => ({
  left: footerConfig.value.left,
  center: footerConfig.value.content,
  right: footerConfig.value.right,
}))

const shouldRenderFooter = computed(() =>
  !footerConfig.value.requireSiteName || Boolean(siteInfo.value?.name),
)
</script>

<template>
  <LazyRegionArea
    v-if="footerConfig.showSubFooterRegion"
    area="sub_footer"
    as="aside"
  />

  <UFooter
    v-if="shouldRenderFooter"
    aria-label="Site Footer"
    :ui="{
      root: footerConfig.base,
      container: footerContainerClass,
      left: hasLeft ? '' : 'hidden',
      right: hasRight ? '' : 'hidden',
    }"
  >
    <template #left>
      <div
        v-if="hasLeft"
        :class="footerSectionClasses.left"
      >
        <FooterAtomList
          v-bind="footerAtomProps"
          :atoms="footerSections.left"
        />
      </div>
    </template>

    <template #default>
      <LazyRegionArea
        v-if="footerConfig.showFooterRegion"
        area="footer"
      />

      <div
        v-if="hasCenter"
        :class="footerSectionClasses.center"
      >
        <FooterAtomList
          v-bind="footerAtomProps"
          :atoms="footerSections.center"
        />
      </div>
    </template>

    <template #right>
      <div
        v-if="hasRight"
        :class="footerSectionClasses.right"
      >
        <FooterAtomList
          v-bind="footerAtomProps"
          :atoms="footerSections.right"
        />
      </div>
    </template>
  </UFooter>
</template>
