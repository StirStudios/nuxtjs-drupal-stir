<script setup lang="ts">
import FooterAtomList from '~/components/App/Footer/AtomList.vue'
import type {
  AppContextFooterMenuItem,
  AppContextSiteInfo,
} from '~/composables/useAppContext'
import type { SocialIcon } from '~/types'

type FooterAtom = 'logo' | 'menu' | 'socials' | 'slogan' | 'email' | 'legal' | 'copyright' | 'poweredBy'
type FooterLayout = 'default' | 'columns' | 'stacked'
type FooterSections = Record<'left' | 'center' | 'right', FooterAtom[]>
type FooterAtomVisibility = Record<FooterAtom, boolean>

type FooterConfig = {
  layout: FooterLayout
  requireSiteName: boolean
  showLogo: boolean
  showMenu: boolean
  showSocials: boolean
  showSlogan: boolean
  showEmail: boolean
  showCopyright: boolean
  showPoweredBy: boolean
  showFooterRegion: boolean
  showSubFooterRegion: boolean
  base: string
  container: string
  content: string
  left: string
  right: string
  center: string
  footerLinks: string
  logo: string
  logoFromTheme: string
  menu: string
  menuItem: string
  menuList: string
  socials: string
  socialIcon: string
  slogan: string
  email: string
  copyright: string
  poweredBy: string
  rights: string
  sections: FooterSections
}

type ThemeRecord = Record<string, unknown>

const DEFAULT_FOOTER_SECTIONS: FooterSections = {
  left: ['logo'],
  center: ['menu', 'legal'],
  right: ['socials', 'email'],
}

const DEFAULT_FOOTER: FooterConfig = {
  layout: 'default',
  requireSiteName: false,
  showLogo: true,
  showMenu: true,
  showSocials: true,
  showSlogan: false,
  showEmail: true,
  showCopyright: true,
  showPoweredBy: true,
  showFooterRegion: true,
  showSubFooterRegion: true,
  base: 'mt-12 bg-accented py-10 text-sm text-default dark:bg-muted/50 lg:mt-20',
  container: '',
  content: 'flex flex-col items-center justify-center gap-4 text-center',
  left: 'mt-8 text-sm leading-relaxed lg:mt-0 lg:text-left',
  right: 'flex flex-col items-center gap-2 lg:items-end lg:text-right',
  center: '',
  footerLinks: 'transition-colors text-primary hover:text-primary/90',
  logo: '',
  logoFromTheme: '',
  menu: 'mb-3',
  menuItem: 'min-w-0 py-0',
  menuList: 'flex flex-wrap justify-center',
  socials: 'flex gap-1',
  socialIcon: 'me-1',
  slogan: 'mb-2',
  email: '',
  copyright: 'mb-0',
  poweredBy: 'mb-0',
  rights: '',
  sections: DEFAULT_FOOTER_SECTIONS,
}

const toRecord = (value: unknown): ThemeRecord =>
  value && typeof value === 'object' ? (value as ThemeRecord) : {}

const toString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback

const toBool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

const toLayout = (value: unknown): FooterLayout =>
  value === 'columns' || value === 'stacked' ? value : 'default'

const toAtomList = (value: unknown, fallback: FooterAtom[]): FooterAtom[] => {
  if (!Array.isArray(value)) {
    return fallback.slice()
  }

  return value
    .filter((entry): entry is FooterAtom =>
      typeof entry === 'string'
      && [
        'logo',
        'menu',
        'socials',
        'slogan',
        'email',
        'legal',
        'copyright',
        'poweredBy',
      ].includes(entry),
    )
    .filter((entry, index, list) => list.indexOf(entry) === index)
}

const { getPage } = useDrupalCe()
const page = getPage()
const { iconsSocialConfig } = useSocialIcons()
const currentYear = new Date().getFullYear()

const theme = computed(() => toRecord(useAppConfig().stirTheme))
const themeFooter = computed(() => toRecord(theme.value.footer))
const themeNavigation = computed(() => toRecord(theme.value.navigation))
const themeContainer = computed(() => toString(theme.value.container))

const footerConfig = computed<FooterConfig>(() => {
  const next = { ...DEFAULT_FOOTER, ...themeFooter.value } as ThemeRecord
  const sections = toRecord(next.sections)

  return {
    ...DEFAULT_FOOTER,
    ...next,
    layout: toLayout(next.layout),
    requireSiteName: toBool(next.requireSiteName, DEFAULT_FOOTER.requireSiteName),
    showLogo: toBool(next.showLogo, DEFAULT_FOOTER.showLogo),
    showMenu: toBool(next.showMenu, DEFAULT_FOOTER.showMenu),
    showSocials: toBool(next.showSocials, DEFAULT_FOOTER.showSocials),
    showSlogan: toBool(next.showSlogan, DEFAULT_FOOTER.showSlogan),
    showEmail: toBool(next.showEmail, DEFAULT_FOOTER.showEmail),
    showCopyright: toBool(next.showCopyright, DEFAULT_FOOTER.showCopyright),
    showPoweredBy: toBool(next.showPoweredBy, DEFAULT_FOOTER.showPoweredBy),
    showFooterRegion: toBool(next.showFooterRegion, DEFAULT_FOOTER.showFooterRegion),
    showSubFooterRegion: toBool(next.showSubFooterRegion, DEFAULT_FOOTER.showSubFooterRegion),
    base: toString(next.base, DEFAULT_FOOTER.base),
    container: toString(next.container, DEFAULT_FOOTER.container),
    content: toString(next.content, DEFAULT_FOOTER.content),
    left: toString(next.left, DEFAULT_FOOTER.left),
    right: toString(next.right, DEFAULT_FOOTER.right),
    center: toString(next.center, DEFAULT_FOOTER.center),
    footerLinks: toString(next.footerLinks, DEFAULT_FOOTER.footerLinks),
    logo: toString(next.logo, DEFAULT_FOOTER.logo),
    menu: toString(next.menu, DEFAULT_FOOTER.menu),
    menuItem: toString(next.menuItem, DEFAULT_FOOTER.menuItem),
    menuList: toString(next.menuList, DEFAULT_FOOTER.menuList),
    socials: toString(next.socials, DEFAULT_FOOTER.socials),
    socialIcon: toString(next.socialIcon, DEFAULT_FOOTER.socialIcon),
    slogan: toString(next.slogan, DEFAULT_FOOTER.slogan),
    email: toString(next.email, DEFAULT_FOOTER.email),
    copyright: toString(next.copyright, DEFAULT_FOOTER.copyright),
    poweredBy: toString(next.poweredBy, DEFAULT_FOOTER.poweredBy),
    rights: toString(next.rights, DEFAULT_FOOTER.rights),
    logoFromTheme: toString(
      themeNavigation.value.logoScrolledClass || themeNavigation.value.logoClass,
      DEFAULT_FOOTER.logoFromTheme,
    ),
    sections: {
      left: toAtomList(sections.left, DEFAULT_FOOTER_SECTIONS.left),
      center: toAtomList(sections.center, DEFAULT_FOOTER_SECTIONS.center),
      right: toAtomList(sections.right, DEFAULT_FOOTER_SECTIONS.right),
    },
  }
})

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
