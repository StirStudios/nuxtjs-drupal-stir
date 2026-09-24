import type {
  RouteHero,
  RouteHeroAction,
  RouteHeroDefinition,
  RouteHeroImage,
  RouteHeroInput,
} from '../types/RouteHero'
import { matchesRoutePattern } from './colorMode'
import { resolveDrupalLink, type DrupalLink } from './drupalLink'
import { resolveBooleanProp } from './nuxtUiProps'

type PayloadNode = {
  element?: unknown
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type RouteHeroPage = {
  title?: unknown
  content?: PayloadNode | null
  metatags?: { meta?: unknown } | null
  site_info?: { name?: unknown } | null
} | null | undefined

export type EditorialRouteHeroInput = Omit<RouteHeroInput, 'variant'> & {
  summary?: string
}

const defaultRouteHeroElements = ['node-page']

export function resolveRouteHeroElements(elements?: readonly string[]): readonly string[] {
  return elements?.length ? elements : defaultRouteHeroElements
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number | undefined {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value

  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined
}

function plainText(value: unknown): string {
  return text(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slotNodes(node: PayloadNode | null | undefined, name: string): PayloadNode[] {
  const slot = node?.slots?.[name]

  return Array.isArray(slot) ? slot.filter(item => item && typeof item === 'object') : []
}

function metaContent(page: RouteHeroPage, name: string): string {
  const meta = page?.metatags?.meta

  if (!Array.isArray(meta)) return ''

  return text(meta.find(tag => tag?.name === name)?.content)
}

function withoutSiteSuffix(title: string, siteName: string): string {
  if (!siteName) return title

  const suffix = ` | ${siteName}`

  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title
}

function payloadAction(node: PayloadNode): RouteHeroAction | null {
  const link = resolveDrupalLink(node.props?.link as DrupalLink | undefined)

  return normalizeAction({
    label: text(link.title),
    to: text(link.url),
    color: text(node.props?.color) || undefined,
    variant: text(node.props?.variant) || undefined,
    icon: text(node.props?.icon) || undefined,
    external: link.external,
  })
}

function normalizeAction(action: Partial<RouteHeroAction> | null | undefined): RouteHeroAction | null {
  const label = text(action?.label)
  const to = text(action?.to)

  return label && to ? { ...action, label, to } : null
}

function normalizeImage(image: Partial<RouteHeroImage> | null | undefined): RouteHeroImage | undefined {
  const src = text(image?.src)

  if (!src) return undefined

  return {
    src,
    alt: text(image?.alt),
    width: number(image?.width),
    height: number(image?.height),
    originalSrc: text(image?.originalSrc) || undefined,
    originalRevision: text(image?.originalRevision) || undefined,
    position: text(image?.position) || undefined,
  }
}

export function normalizeRouteHero(input: RouteHeroInput | null | undefined): RouteHero | null {
  const title = text(input?.title)

  if (!input || !title) return null

  const actions = (input.actions ?? [])
    .map(normalizeAction)
    .filter((action): action is RouteHeroAction => Boolean(action))
  const titleLines = (input.titleLines ?? []).map(text).filter(Boolean)

  return {
    ...input,
    title,
    titleLines: titleLines.length ? titleLines : undefined,
    eyebrow: text(input.eyebrow) || undefined,
    description: text(input.description) || undefined,
    actions: actions.length ? actions : undefined,
    image: normalizeImage(input.image),
    surfaceClass: text(input.surfaceClass) || undefined,
  }
}

/** Every image in the page hero slot, in payload order (video media yields its poster). */
export function resolvePageRouteHeroImages(page: RouteHeroPage): RouteHeroImage[] {
  return slotNodes(page?.content, 'hero')
    .flatMap(node => slotNodes(node, 'media'))
    .map(node => normalizeImage(node.props as Partial<RouteHeroImage>))
    .filter((image): image is RouteHeroImage => Boolean(image))
}

/**
 * Builds a hero from a Drupal page payload: the first Hero paragraph in the
 * `hero` slot supplies copy, actions and media, and the page title fills a
 * blank header. The description is only ever the authored Hero text: a meta
 * description is written for search results and usually repeats the page's
 * opening paragraph.
 */
export function resolvePageRouteHero(
  page: RouteHeroPage,
  elements?: readonly string[],
): RouteHero | null {
  const content = page?.content

  if (!content || !resolveRouteHeroElements(elements).includes(text(content.element))) return null

  const heroNode = slotNodes(content, 'hero')[0]
  const siteName = text(page?.site_info?.name)
  const image = resolvePageRouteHeroImages(page)[0]

  return normalizeRouteHero({
    title: text(heroNode?.props?.header)
      || text(content.props?.title)
      || text(page?.title)
      || withoutSiteSuffix(metaContent(page, 'title'), siteName),
    eyebrow: text(heroNode?.props?.eyebrow),
    description: plainText(heroNode?.props?.text),
    actions: slotNodes(heroNode, 'button')
      .map(payloadAction)
      .filter((action): action is RouteHeroAction => Boolean(action)),
    hideTitle: resolveBooleanProp(content.props?.hideTitle),
    image,
    variant: image ? 'cover' : 'simple',
  })
}

export function matchRouteHeroDefinition(
  path: string,
  definitions: readonly RouteHeroDefinition[] | undefined,
): RouteHeroDefinition | undefined {
  return definitions?.find(definition => matchesRoutePattern(path, definition.path))
}

/** Builds an overlap hero from an editorial node's canonical visual and title. */
export function resolveEditorialRouteHero(input: EditorialRouteHeroInput): RouteHero | null {
  const { summary, ...hero } = input

  return normalizeRouteHero({
    ...hero,
    description: hero.description ?? summary,
    image: hero.mediaFirst ? undefined : hero.image,
    variant: 'overlap',
  })
}
