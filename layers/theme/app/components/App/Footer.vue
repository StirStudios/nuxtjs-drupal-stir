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
type FooterAtom =
  | 'logo'
  | 'menu'
  | 'socials'
  | 'slogan'
  | 'email'
  | 'legal'
  | 'copyright'
  | 'poweredBy'
type FooterSections = {
  left?: string[]
  center?: string[]
  right?: string[]
}

type RenderedFooterSections = {
  left: FooterAtom[]
  center: FooterAtom[]
  right: FooterAtom[]
}

const {
  data: appContext,
  execute: loadAppFooterContext,
} = await useAppFooterContext({ immediate: false })

const toFooterLayout = (value: unknown): FooterLayout => {
  return value === 'columns' || value === 'stacked' ? value : 'default'
}

const toClassName = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim()

        return ''
      })
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (items.length === 0) {
    return undefined
  }

  return items
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
  await loadAppFooterContext()
}

watch(needsAppContext, (needsContext) => {
  if (needsContext) {
    void loadAppFooterContext()
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
      center: toSectionAtoms(configured.center) || ['menu', 'socials', 'legal'],
      right: [],
    }
  }

  return {
    left: toSectionAtoms(configured.left) || ['logo'],
    center: toSectionAtoms(configured.center) || ['menu', 'legal'],
    right: toSectionAtoms(configured.right) || ['socials', 'email'],
  }
})

const navigationConfig = computed(() => theme.navigation as Record<string, unknown>)
const footerClasses = computed(() => ({
  copyright: toClassName(footerConfig.value.copyright),
  email: toClassName(footerConfig.value.email),
  logo: toClassName(
    footerConfig.value.logo
      || navigationConfig.value.logoScrolledClass
      || navigationConfig.value.logoClass,
  ),
  menu: toClassName(footerConfig.value.menu),
  menuItem: toClassName(footerConfig.value.menuItem),
  menuList: toClassName(footerConfig.value.menuList),
  poweredBy: toClassName(footerConfig.value.poweredBy),
  slogan: toClassName(footerConfig.value.slogan),
  socialIcon: toClassName(footerConfig.value.socialIcon),
  socials: toClassName(footerConfig.value.socials),
}))
const footerShow = computed(() => ({
  copyright: footerConfig.value.showCopyright !== false,
  email: footerConfig.value.showEmail !== false,
  logo: footerConfig.value.showLogo !== false && theme.navigation.logo !== false,
  menu: footerConfig.value.showMenu !== false,
  poweredBy: footerConfig.value.showPoweredBy !== false,
  slogan: footerConfig.value.showSlogan === true,
  socials: footerConfig.value.showSocials !== false,
}))

const canRenderFooterAtom = (atom: FooterAtom): boolean => {
  switch (atom) {
    case 'logo':
      return (
        footerShow.value.logo
        && theme.navigation.logo !== false
        && (Boolean(theme.navigation.logo) || Boolean(siteInfo.value?.name))
      )
    case 'menu':
      return footerShow.value.menu && footerMenuItems.value.length > 0
    case 'socials':
      return footerShow.value.socials && iconsSocialConfig.length > 0
    case 'slogan':
      return footerShow.value.slogan && Boolean(siteInfo.value?.slogan)
    case 'email':
      return footerShow.value.email && Boolean(siteInfo.value?.mail)
    case 'legal':
      return (
        (footerShow.value.copyright || footerShow.value.poweredBy)
        && Boolean(siteInfo.value?.name)
      )
    case 'copyright':
      return footerShow.value.copyright && Boolean(siteInfo.value?.name)
    case 'poweredBy':
      return footerShow.value.poweredBy
    default:
      return false
  }
}

const toFooterAtom = (atom: string): FooterAtom | undefined => {
  switch (atom) {
    case 'logo':
    case 'menu':
    case 'socials':
    case 'slogan':
    case 'email':
    case 'legal':
    case 'copyright':
    case 'poweredBy':
      return atom
    default:
      return undefined
  }
}

const renderFooterAtoms = (atoms: string[] | undefined): FooterAtom[] =>
  (atoms ?? [])
    .map(toFooterAtom)
    .filter((atom): atom is FooterAtom => Boolean(atom))
    .filter((atom) => canRenderFooterAtom(atom))

const footerAtoms = computed<RenderedFooterSections>(() => ({
  left: renderFooterAtoms(footerSections.value.left),
  center: renderFooterAtoms(footerSections.value.center),
  right: renderFooterAtoms(footerSections.value.right),
}))

const footerHasSlots = computed(() => ({
  left: footerAtoms.value.left.length > 0,
  center: footerAtoms.value.center.length > 0,
  right: footerAtoms.value.right.length > 0,
}))

const footerContainerClasses = computed(() =>
  [
    theme.container,
    footerLayout.value === 'stacked' ? 'text-center' : '',
    toClassName(footerConfig.value.container),
  ].filter(Boolean).join(' '),
)

const footerContentClasses = computed(() => {
  if (footerLayout.value === 'stacked') {
    return toClassName(footerConfig.value.content)
  }

  const visibleSectionCount = Object.values(footerHasSlots.value).filter(Boolean).length

  return `grid gap-6 text-center lg:items-start ${
    visibleSectionCount > 1
      ? `lg:grid-cols-${visibleSectionCount}`
      : ''
  }`
})

const footerUi = computed(() => ({
  left: footerHasSlots.value.left ? '' : 'hidden',
  right: footerHasSlots.value.right ? '' : 'hidden',
  center: (!footerHasSlots.value.left && !footerHasSlots.value.right)
    ? 'w-full'
    : '',
}))

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
      left: footerUi.left,
      right: footerUi.right,
      center: footerUi.center,
    }"
  >
    <LazyRegionArea
      v-if="theme.footer.showFooterRegion !== false"
      area="footer"
    />

    <template #left>
      <div
        v-if="footerLayout !== 'stacked' && footerHasSlots.left"
        :class="toClassName(footerConfig.value.left)"
      >
        <template
          v-for="atom in footerAtoms.left"
          :key="`left-${atom}`"
        >
          <template v-if="atom === 'logo' && footerShow.logo">
            <LazyAppLogo
              v-if="theme.navigation.logo"
              :add-classes="footerClasses.logo"
            />
            <template v-else>
              {{ siteInfo?.name }}
            </template>
          </template>

          <LazyUNavigationMenu
            v-else-if="atom === 'menu' && footerShow.menu && footerMenuItems.length"
            aria-label="Footer Navigation"
            :class="footerClasses.menu"
            :items="footerMenuItems"
            :ui="{
              list: footerClasses.menuList,
              item: footerClasses.menuItem,
              link: theme.footer.footerLinks,
            }"
            variant="link"
          />

          <div
            v-else-if="atom === 'socials' && footerShow.socials && iconsSocialConfig.length"
            :class="footerClasses.socials"
          >
            <LazyIconsSocial
              v-for="(icon, index) in iconsSocialConfig"
              :key="String(icon.url || icon.title || index)"
              v-bind="icon"
              :class="footerClasses.socialIcon"
            />
          </div>

          <p
            v-else-if="atom === 'slogan' && footerShow.slogan && siteInfo?.slogan"
            :class="footerClasses.slogan"
          >
            {{ siteInfo.slogan }}
          </p>

          <ULink
            v-else-if="atom === 'email' && footerShow.email && siteInfo?.mail"
            :class="footerClasses.email"
            :inactive-class="theme.footer.footerLinks"
            raw
            target="_blank"
            :to="`mailto:${siteInfo.mail}`"
          >
            {{ siteInfo.mail }}
          </ULink>

          <p
            v-else-if="atom === 'legal' && (footerShow.copyright || footerShow.poweredBy) && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            <template v-if="footerShow.copyright">
              © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
              <template v-if="footerRights">
                {{ footerRights }}<br />
              </template>
            </template>
            <template v-if="footerShow.poweredBy">
              Website created & powered by
              <ULink
                :inactive-class="theme.footer.footerLinks"
                raw
                target="_blank"
                to="https://www.stirstudiosdesign.com"
              >
                StirStudios
              </ULink>
            </template>
          </p>

          <p
            v-else-if="atom === 'copyright' && footerShow.copyright && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
            <template v-if="footerRights">
              {{ footerRights }}<br />
            </template>
          </p>

          <p
            v-else-if="atom === 'poweredBy' && footerShow.poweredBy"
            :class="footerClasses.poweredBy"
          >
            Website created & powered by
            <ULink
              :inactive-class="theme.footer.footerLinks"
              raw
              target="_blank"
              to="https://www.stirstudiosdesign.com"
            >
              StirStudios
            </ULink>
          </p>
        </template>
      </div>
    </template>

    <template #center>
      <div
        v-if="footerHasSlots.center"
        :class="footerLayout === 'stacked' ? footerContentClasses : 'center'"
      >
        <template
          v-for="atom in footerAtoms.center"
          :key="`center-${atom}`"
        >
          <template v-if="atom === 'logo' && footerShow.logo">
            <LazyAppLogo
              v-if="theme.navigation.logo"
              :add-classes="footerClasses.logo"
            />
            <template v-else>
              {{ siteInfo?.name }}
            </template>
          </template>

          <LazyUNavigationMenu
            v-else-if="atom === 'menu' && footerShow.menu && footerMenuItems.length"
            aria-label="Footer Navigation"
            :class="footerClasses.menu"
            :items="footerMenuItems"
            :ui="{
              list: footerClasses.menuList,
              item: footerClasses.menuItem,
              link: theme.footer.footerLinks,
            }"
            variant="link"
          />

          <div
            v-else-if="atom === 'socials' && footerShow.socials && iconsSocialConfig.length"
            :class="footerClasses.socials"
          >
            <LazyIconsSocial
              v-for="(icon, index) in iconsSocialConfig"
              :key="String(icon.url || icon.title || index)"
              v-bind="icon"
              :class="footerClasses.socialIcon"
            />
          </div>

          <p
            v-else-if="atom === 'slogan' && footerShow.slogan && siteInfo?.slogan"
            :class="footerClasses.slogan"
          >
            {{ siteInfo.slogan }}
          </p>

          <ULink
            v-else-if="atom === 'email' && footerShow.email && siteInfo?.mail"
            :class="footerClasses.email"
            :inactive-class="theme.footer.footerLinks"
            raw
            target="_blank"
            :to="`mailto:${siteInfo.mail}`"
          >
            {{ siteInfo.mail }}
          </ULink>

          <p
            v-else-if="atom === 'legal' && (footerShow.copyright || footerShow.poweredBy) && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            <template v-if="footerShow.copyright">
              © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
              <template v-if="footerRights">
                {{ footerRights }}<br />
              </template>
            </template>
            <template v-if="footerShow.poweredBy">
              Website created & powered by
              <ULink
                :inactive-class="theme.footer.footerLinks"
                raw
                target="_blank"
                to="https://www.stirstudiosdesign.com"
              >
                StirStudios
              </ULink>
            </template>
          </p>

          <p
            v-else-if="atom === 'copyright' && footerShow.copyright && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
            <template v-if="footerRights">
              {{ footerRights }}<br />
            </template>
          </p>

          <p
            v-else-if="atom === 'poweredBy' && footerShow.poweredBy"
            :class="footerClasses.poweredBy"
          >
            Website created & powered by
            <ULink
              :inactive-class="theme.footer.footerLinks"
              raw
              target="_blank"
              to="https://www.stirstudiosdesign.com"
            >
              StirStudios
            </ULink>
          </p>
        </template>
      </div>
    </template>

    <template #right>
      <div
        v-if="footerLayout !== 'stacked' && footerHasSlots.right"
        :class="toClassName(footerConfig.value.right)"
      >
        <template
          v-for="atom in footerAtoms.right"
          :key="`right-${atom}`"
        >
          <template v-if="atom === 'logo' && footerShow.logo">
            <LazyAppLogo
              v-if="theme.navigation.logo"
              :add-classes="footerClasses.logo"
            />
            <template v-else>
              {{ siteInfo?.name }}
            </template>
          </template>

          <LazyUNavigationMenu
            v-else-if="atom === 'menu' && footerShow.menu && footerMenuItems.length"
            aria-label="Footer Navigation"
            :class="footerClasses.menu"
            :items="footerMenuItems"
            :ui="{
              list: footerClasses.menuList,
              item: footerClasses.menuItem,
              link: theme.footer.footerLinks,
            }"
            variant="link"
          />

          <div
            v-else-if="atom === 'socials' && footerShow.socials && iconsSocialConfig.length"
            :class="footerClasses.socials"
          >
            <LazyIconsSocial
              v-for="(icon, index) in iconsSocialConfig"
              :key="String(icon.url || icon.title || index)"
              v-bind="icon"
              :class="footerClasses.socialIcon"
            />
          </div>

          <p
            v-else-if="atom === 'slogan' && footerShow.slogan && siteInfo?.slogan"
            :class="footerClasses.slogan"
          >
            {{ siteInfo.slogan }}
          </p>

          <ULink
            v-else-if="atom === 'email' && footerShow.email && siteInfo?.mail"
            :class="footerClasses.email"
            :inactive-class="theme.footer.footerLinks"
            raw
            target="_blank"
            :to="`mailto:${siteInfo.mail}`"
          >
            {{ siteInfo.mail }}
          </ULink>

          <p
            v-else-if="atom === 'legal' && (footerShow.copyright || footerShow.poweredBy) && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            <template v-if="footerShow.copyright">
              © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
              <template v-if="footerRights">
                {{ footerRights }}<br />
              </template>
            </template>
            <template v-if="footerShow.poweredBy">
              Website created & powered by
              <ULink
                :inactive-class="theme.footer.footerLinks"
                raw
                target="_blank"
                to="https://www.stirstudiosdesign.com"
              >
                StirStudios
              </ULink>
            </template>
          </p>

          <p
            v-else-if="atom === 'copyright' && footerShow.copyright && siteInfo?.name"
            :class="footerClasses.copyright"
          >
            © {{ siteInfo.name }} {{ currentYear }}. All Rights Reserved.<br />
            <template v-if="footerRights">
              {{ footerRights }}<br />
            </template>
          </p>

          <p
            v-else-if="atom === 'poweredBy' && footerShow.poweredBy"
            :class="footerClasses.poweredBy"
          >
            Website created & powered by
            <ULink
              :inactive-class="theme.footer.footerLinks"
              raw
              target="_blank"
              to="https://www.stirstudiosdesign.com"
            >
              StirStudios
            </ULink>
          </p>
        </template>
      </div>
    </template>
  </UFooter>
</template>
