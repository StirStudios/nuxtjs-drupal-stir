<script setup lang="ts">
import type {
  AppContextFooterMenuItem,
  AppContextSiteInfo,
} from '~/composables/useAppContext'

const { getPage } = useDrupalCe()
const page = getPage()
const theme = useAppConfig().stirTheme
const { iconsSocialConfig } = useSocialIcons()
const currentYear = new Date().getFullYear()

type FooterLayout = 'default' | 'columns' | 'stacked'
type FooterSections = {
  left?: string[]
  center?: string[]
  right?: string[]
}

const { data: appContext, execute: loadAppContext } = await useAppContext({ immediate: false })

const toFooterLayout = (value: unknown): FooterLayout => {
  return value === 'columns' || value === 'stacked' ? value : 'default'
}

const toClassName = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()

  if (Array.isArray(value)) {
    return value
      .map((entry) => toClassName(entry))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined

  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)

  return items.length ? items : undefined
}
const toSectionAtoms = (value: unknown): string[] | undefined => {
  const items = toStringArray(value)

  return items?.filter((item, index) => items.indexOf(item) === index)
}

const footerConfig = computed(() => theme.footer)
const footerLayout = computed(() => toFooterLayout(footerConfig.value.layout))
const pageFooterMenu = computed<AppContextFooterMenuItem[] | undefined>(() => {
  const menu = page.value?.footer_menu

  return Array.isArray(menu) ? (menu as AppContextFooterMenuItem[]) : undefined
})
const pageSiteInfo = computed<AppContextSiteInfo | undefined>(() => {
  const siteInfo = page.value?.site_info

  return siteInfo && typeof siteInfo === 'object'
    ? siteInfo as AppContextSiteInfo
    : undefined
})
const needsAppContext = computed(() => !pageFooterMenu.value || !pageSiteInfo.value)

if (needsAppContext.value) {
  await loadAppContext()
}

watch(needsAppContext, (needsContext) => {
  if (needsContext) {
    void loadAppContext()
  }
})

const footerMenu = computed<AppContextFooterMenuItem[]>(() => {
  const menu = pageFooterMenu.value ?? appContext.value?.footer_menu

  return Array.isArray(menu) ? (menu as AppContextFooterMenuItem[]) : []
})
const siteInfo = computed<AppContextSiteInfo | undefined>(() => {
  return pageSiteInfo.value ?? appContext.value?.site_info
})
const footerRights = computed(() => {
  const rightsValue = (footerConfig.value as Record<string, unknown>).rights

  return typeof rightsValue === 'string' ? rightsValue : ''
})
const footerMenuItems = computed(() =>
  footerMenu.value.map((item) => ({
    label: item.title || '',
    to: item.url || '',
  })),
)
const footerSections = computed<Required<FooterSections>>(() => {
  const configured = (footerConfig.value as { sections?: FooterSections }).sections || {}

  if (footerLayout.value === 'stacked') {
    return {
      left: [],
      center: toSectionAtoms(configured.center) || ['actions', 'menu', 'socials', 'legal'],
      right: [],
    }
  }

  return {
    left: toSectionAtoms(configured.left) || ['logo'],
    center: toSectionAtoms(configured.center) || ['menu', 'legal'],
    right: toSectionAtoms(configured.right) || ['socials', 'email'],
  }
})
const footerClasses = computed(() => ({
  action: toClassName(footerConfig.value.action),
  actions: toClassName(footerConfig.value.actionsWrapper),
  copyright: toClassName(footerConfig.value.copyright),
  email: toClassName(footerConfig.value.email),
  logo: toClassName(footerConfig.value.logo || theme.navigation.logoScrolledSize || theme.navigation.logoSize),
  menu: toClassName(footerConfig.value.menu),
  menuItem: toClassName(footerConfig.value.menuItem),
  menuList: toClassName(footerConfig.value.menuList),
  poweredBy: toClassName(footerConfig.value.poweredBy),
  slogan: toClassName(footerConfig.value.slogan),
  socialIcon: toClassName(footerConfig.value.socialIcon),
  socials: toClassName(footerConfig.value.socials),
}))
const footerShow = computed(() => ({
  actions: footerConfig.value.showActions !== false,
  copyright: footerConfig.value.showCopyright !== false,
  email: footerConfig.value.showEmail !== false,
  logo: footerConfig.value.showLogo !== false && theme.navigation.logo !== false,
  menu: footerConfig.value.showMenu !== false,
  poweredBy: footerConfig.value.showPoweredBy !== false && footerConfig.value.poweredby !== false,
  slogan: footerConfig.value.showSlogan === true,
  socials: footerConfig.value.showSocials !== false,
}))
const footerContainerClasses = computed(() =>
  [
    theme.container,
    'text-center',
    toClassName(footerConfig.value.container),
  ].filter(Boolean).join(' '),
)
const stackedContentClasses = computed(() =>
  [
    theme.container,
    toClassName(footerConfig.value.content),
  ].filter(Boolean).join(' '),
)
const shouldRenderFooter = computed(() =>
  !footerConfig.value.requireSiteName || Boolean(siteInfo.value?.name),
)
</script>

<template>
  <LazyRegionArea
    v-if="theme.footer.showSubFooterRegion !== false"
    area="sub_footer"
  />

  <UFooter
    v-if="shouldRenderFooter"
    aria-label="Site Footer"
    :ui="{
      root: theme.footer.base,
      container: footerContainerClasses,
      left: theme.footer.left,
      right: theme.footer.right,
    }"
  >
    <LazyRegionArea
      v-if="theme.footer.showFooterRegion !== false"
      area="footer"
    />

    <div
      v-if="footerLayout === 'stacked'"
      :class="stackedContentClasses"
    >
      <AppFooterSection
        :actions="theme.footer.actions"
        :atoms="footerSections.center"
        :classes="footerClasses"
        :current-year="currentYear"
        :footer-links="theme.footer.footerLinks"
        :hide-email="theme.footer.hideEmail"
        :menu-items="footerMenuItems"
        :rights="footerRights"
        :show="footerShow"
        :site-info="siteInfo"
        :social-icons="iconsSocialConfig"
      />
    </div>

    <template
      v-if="footerLayout !== 'stacked'"
      #left
    >
      <AppFooterSection
        :actions="theme.footer.actions"
        :atoms="footerSections.left"
        :classes="footerClasses"
        :current-year="currentYear"
        :footer-links="theme.footer.footerLinks"
        :hide-email="theme.footer.hideEmail"
        :menu-items="footerMenuItems"
        :rights="footerRights"
        :show="footerShow"
        :site-info="siteInfo"
        :social-icons="iconsSocialConfig"
      >
        <template #logo>
          <LazyAppLogo
            v-if="footerShow.logo && theme.navigation.logo"
            :add-classes="footerClasses.logo"
          />
          <template v-else-if="footerShow.logo">
            {{ siteInfo?.name }}
          </template>
        </template>
      </AppFooterSection>
    </template>

    <div
      v-if="footerLayout !== 'stacked'"
      class="center"
    >
      <AppFooterSection
        :actions="theme.footer.actions"
        :atoms="footerSections.center"
        :classes="footerClasses"
        :current-year="currentYear"
        :footer-links="theme.footer.footerLinks"
        :hide-email="theme.footer.hideEmail"
        :menu-items="footerMenuItems"
        :rights="footerRights"
        :show="footerShow"
        :site-info="siteInfo"
        :social-icons="iconsSocialConfig"
      />
    </div>

    <template
      v-if="footerLayout !== 'stacked'"
      #right
    >
      <AppFooterSection
        :actions="theme.footer.actions"
        :atoms="footerSections.right"
        :classes="footerClasses"
        :current-year="currentYear"
        :footer-links="theme.footer.footerLinks"
        :hide-email="theme.footer.hideEmail"
        :menu-items="footerMenuItems"
        :rights="footerRights"
        :show="footerShow"
        :site-info="siteInfo"
        :social-icons="iconsSocialConfig"
      />
    </template>
  </UFooter>
</template>
