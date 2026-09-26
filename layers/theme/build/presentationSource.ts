import { createHash } from 'node:crypto'
import { GRID_BREAKPOINTS, WIDTH_MAX_WIDTH_CLASSES } from '../app/utils/gridClasses'

export type PresentationWarningHandler = (message: string) => void

const SAFE_CLASS_CHARACTERS = /^[a-z0-9_./:@%#,+*()!&>~=\-[\]]+$/iu
const UNSAFE_CLASS_SOURCE = /[\s"'`;{}\\]|url\s*\(/iu

function isSafeClassToken(value: string): boolean {
  if (value.length < 1 || value.length > 120) return false
  if (!SAFE_CLASS_CHARACTERS.test(value) || UNSAFE_CLASS_SOURCE.test(value)) return false

  let bracketDepth = 0

  for (const character of value) {
    if (character === '[') bracketDepth += 1
    if (character === ']') bracketDepth -= 1
    if (bracketDepth < 0 || bracketDepth > 4) return false
  }
  return bracketDepth === 0
}

const ALIGNMENT_RECIPES: Record<string, string> = {
  justify_left: 'justify-start', justify_center: 'justify-center', justify_right: 'justify-end',
  align_top: 'items-start', align_center: 'items-center', align_bottom: 'items-end',
  text_left: 'text-start', text_center: 'text-center', text_right: 'text-end',
}

// Mirrors the allowed values of stir_layout_builder's field_spacing.
const SPACING_OPTIONS = ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py']
  .flatMap(side => [2, 5, 10, 20].map(size => `${side}-${size}`))

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

/**
 * Every utility the layout fields can produce, compiled whether or not
 * content uses it yet: grid columns 1-12 and gaps 0-20 at every breakpoint
 * the grid field offers, plus every spacing, width and alignment option, so a
 * value an editor picks for the first time already has CSS.
 */
export function layoutVocabulary(): string[] {
  const classes = new Set<string>([
    'grid', 'grid-cols-1',
    'sm:grid-cols-2', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'sm:gap-4', 'lg:gap-6', 'lg:gap-8',
    'lg:grid-cols-[8fr_4fr]', 'lg:grid-cols-[4fr_8fr]',
  ])

  for (const breakpoint of GRID_BREAKPOINTS) {
    const variant = breakpoint === 'default' ? '' : `${breakpoint}:`

    for (const value of range(1, 12)) {
      classes.add(`${variant}grid-cols-${value}`)
      classes.add(`${variant}${value === 1 ? 'basis-full' : `basis-1/${value}`}`)
    }
    for (const value of range(0, 20)) classes.add(`${variant}gap-${value}`)
  }
  // The largest spacing steps down on small screens.
  for (const utility of SPACING_OPTIONS) {
    if (utility.endsWith('-20')) {
      classes.add(utility.replace(/-20$/u, '-10'))
      classes.add(`lg:${utility}`)
      continue
    }
    classes.add(utility)
  }
  for (const maxWidthClass of Object.values(WIDTH_MAX_WIDTH_CLASSES)) {
    classes.add('mx-auto')
    classes.add(maxWidthClass)
  }
  for (const utility of Object.values(ALIGNMENT_RECIPES)) {
    classes.add(utility)
    if (utility.startsWith('justify-') || utility.startsWith('items-')) classes.add('md:flex')
  }
  return [...classes].sort()
}

export type PresentationConfig = {
  surfaces?: Record<string, { label: string, class: string }>
  variants?: Record<string, { label: string, class: string }>
  richText?: string[]
}

/**
 * Merges `stirTheme.presentation` from every Nuxt layer, nearest first, the
 * way Nuxt merges app config: nearer layers override choices with the same
 * ID, and rich-text lists combine.
 */
export function mergePresentationConfigs(configs: PresentationConfig[]): Required<PresentationConfig> {
  const farthestFirst = [...configs].reverse()

  return {
    surfaces: Object.assign({}, ...farthestFirst.map(config => config.surfaces || {})),
    variants: Object.assign({}, ...farthestFirst.map(config => config.variants || {})),
    richText: [...new Set(configs.flatMap(config => config.richText || []))],
  }
}

/**
 * Classes a project's presentation catalogue and rich-text list declare.
 * Unsafe tokens are skipped with a warning.
 */
export function catalogueUtilities(
  presentation: PresentationConfig,
  options: { warn?: PresentationWarningHandler } = {},
): string[] {
  const classes = new Set<string>()
  const warn = options.warn || (() => {})
  const declared = [
    ...Object.values(presentation.surfaces || {}).map(option => option.class),
    ...Object.values(presentation.variants || {}).map(option => option.class),
    ...(presentation.richText || []),
  ]

  for (const value of declared) {
    for (const utility of value.split(/\s+/u).filter(Boolean)) {
      if (!isSafeClassToken(utility)) {
        warn(`Ignored unsafe presentation class token: ${utility}`)
        continue
      }
      classes.add(utility)
    }
  }
  return [...classes].sort()
}

export function inlinePresentationSource(classes: string[]): string {
  const lines: string[] = []

  for (let index = 0; index < classes.length; index += 20) {
    lines.push(`@source inline("${classes.slice(index, index + 20).join(' ')}");`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * Builds the Tailwind source for the layout vocabulary plus the project's
 * catalogue and rich-text utilities, and its revision.
 */
export function buildPresentationSource(options: { extraUtilities?: string[] } = {}): {
  source: string
  sourceRevision: string
  utilityCount: number
  sourceBytes: number
} {
  const utilities = [...new Set([
    ...layoutVocabulary(),
    ...(options.extraUtilities || []),
  ])].sort()
  const source = inlinePresentationSource(utilities)

  return {
    source,
    sourceRevision: createHash('sha256').update(source).digest('hex'),
    utilityCount: utilities.length,
    sourceBytes: Buffer.byteLength(source, 'utf8'),
  }
}
