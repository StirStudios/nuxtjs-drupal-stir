export type FooterAtom =
  | 'logo'
  | 'menu'
  | 'socials'
  | 'slogan'
  | 'email'
  | 'legal'
  | 'copyright'
  | 'poweredBy'

export type FooterLayout = 'default' | 'columns' | 'stacked'
export type FooterSections = Record<'left' | 'center' | 'right', FooterAtom[]>
export type FooterAtomVisibility = Record<FooterAtom, boolean>

export type FooterThemeConfig = {
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
  centerSlot: string
  left: string
  leftSlot: string
  right: string
  rightSlot: string
  center: string
  footerLinks: string
  logo: string
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

export type FooterConfig = FooterThemeConfig & {
  logoFromTheme: string
}

type ThemeRecord = Record<string, unknown>

export const DEFAULT_FOOTER_SECTIONS: FooterSections = {
  left: ['logo'],
  center: ['menu', 'legal'],
  right: ['socials', 'email'],
}

export const DEFAULT_FOOTER_THEME: Omit<FooterThemeConfig, 'center' | 'sections'> = {
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
  container: 'flex flex-col lg:flex-row',
  content: 'flex flex-col items-center justify-center gap-4 text-center',
  centerSlot: '',
  left: 'mt-8 text-sm leading-relaxed lg:mt-0 lg:text-left',
  leftSlot: '',
  right: 'flex flex-col items-center gap-2 lg:items-end lg:text-right',
  rightSlot: '',
  footerLinks: 'text-primary-800 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200 underline underline-offset-4 transition-colors',
  logo: '',
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
}

export function toThemeRecord(value: unknown): ThemeRecord {
  return value && typeof value === 'object' ? value as ThemeRecord : {}
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function toBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function toLayout(value: unknown): FooterLayout {
  return value === 'columns' || value === 'stacked' ? value : 'default'
}

function toAtomList(value: unknown, fallback: FooterAtom[]): FooterAtom[] {
  if (!Array.isArray(value)) return fallback.slice()

  const atoms: FooterAtom[] = [
    'logo',
    'menu',
    'socials',
    'slogan',
    'email',
    'legal',
    'copyright',
    'poweredBy',
  ]

  return value
    .filter((entry): entry is FooterAtom =>
      typeof entry === 'string' && atoms.includes(entry as FooterAtom),
    )
    .filter((entry, index, list) => list.indexOf(entry) === index)
}

export function resolveFooterConfig(
  footer: unknown,
  navigation: unknown,
): FooterConfig {
  const footerRecord = toThemeRecord(footer)
  const navigationRecord = toThemeRecord(navigation)
  const next = { ...DEFAULT_FOOTER_THEME, ...footerRecord } as ThemeRecord
  const sections = toThemeRecord(next.sections)

  return {
    ...DEFAULT_FOOTER_THEME,
    layout: toLayout(next.layout),
    requireSiteName: toBool(next.requireSiteName, DEFAULT_FOOTER_THEME.requireSiteName),
    showLogo: toBool(next.showLogo, DEFAULT_FOOTER_THEME.showLogo),
    showMenu: toBool(next.showMenu, DEFAULT_FOOTER_THEME.showMenu),
    showSocials: toBool(next.showSocials, DEFAULT_FOOTER_THEME.showSocials),
    showSlogan: toBool(next.showSlogan, DEFAULT_FOOTER_THEME.showSlogan),
    showEmail: toBool(next.showEmail, DEFAULT_FOOTER_THEME.showEmail),
    showCopyright: toBool(next.showCopyright, DEFAULT_FOOTER_THEME.showCopyright),
    showPoweredBy: toBool(next.showPoweredBy, DEFAULT_FOOTER_THEME.showPoweredBy),
    showFooterRegion: toBool(next.showFooterRegion, DEFAULT_FOOTER_THEME.showFooterRegion),
    showSubFooterRegion: toBool(next.showSubFooterRegion, DEFAULT_FOOTER_THEME.showSubFooterRegion),
    base: toString(next.base, DEFAULT_FOOTER_THEME.base),
    container: toString(next.container, DEFAULT_FOOTER_THEME.container),
    content: toString(next.content, DEFAULT_FOOTER_THEME.content),
    centerSlot: toString(next.centerSlot, DEFAULT_FOOTER_THEME.centerSlot),
    left: toString(next.left, DEFAULT_FOOTER_THEME.left),
    leftSlot: toString(next.leftSlot, DEFAULT_FOOTER_THEME.leftSlot),
    right: toString(next.right, DEFAULT_FOOTER_THEME.right),
    rightSlot: toString(next.rightSlot, DEFAULT_FOOTER_THEME.rightSlot),
    center: toString(next.center),
    footerLinks: toString(next.footerLinks, DEFAULT_FOOTER_THEME.footerLinks),
    logo: toString(next.logo, DEFAULT_FOOTER_THEME.logo),
    menu: toString(next.menu, DEFAULT_FOOTER_THEME.menu),
    menuItem: toString(next.menuItem, DEFAULT_FOOTER_THEME.menuItem),
    menuList: toString(next.menuList, DEFAULT_FOOTER_THEME.menuList),
    socials: toString(next.socials, DEFAULT_FOOTER_THEME.socials),
    socialIcon: toString(next.socialIcon, DEFAULT_FOOTER_THEME.socialIcon),
    slogan: toString(next.slogan, DEFAULT_FOOTER_THEME.slogan),
    email: toString(next.email, DEFAULT_FOOTER_THEME.email),
    copyright: toString(next.copyright, DEFAULT_FOOTER_THEME.copyright),
    poweredBy: toString(next.poweredBy, DEFAULT_FOOTER_THEME.poweredBy),
    rights: toString(next.rights, DEFAULT_FOOTER_THEME.rights),
    logoFromTheme: toString(
      navigationRecord.logoScrolledClass || navigationRecord.logoClass,
    ),
    sections: {
      left: toAtomList(sections.left, DEFAULT_FOOTER_SECTIONS.left),
      center: toAtomList(sections.center, DEFAULT_FOOTER_SECTIONS.center),
      right: toAtomList(sections.right, DEFAULT_FOOTER_SECTIONS.right),
    },
  }
}
