import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import * as v from 'valibot'

const breakpointSchema = v.record(
  v.string(),
  v.array(v.pipe(v.number(), v.integer())),
)

const presentationManifestSchema = v.strictObject({
  schemaVersion: v.literal(1),
  site: v.strictObject({
    uuid: v.string(),
    name: v.string(),
    theme: v.string(),
  }),
  capabilities: v.array(v.string()),
  used: v.strictObject({
    grid: v.strictObject({
      columns: breakpointSchema,
      gap: breakpointSchema,
      matrix: v.boolean(),
    }),
    spacing: v.array(v.string()),
    width: v.array(v.string()),
    alignment: v.array(v.string()),
  }),
  legacyClasses: v.array(v.string()),
  diagnostics: v.strictObject({
    rejectedLegacyClassCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
  revision: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
})

export type PresentationManifest = v.InferOutput<typeof presentationManifestSchema>
export type PresentationManifestMode = 'compatibility' | 'hybrid' | 'strict'

const BREAKPOINTS = new Set(['default', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024
const SPACING = /^(?:p|m)(?:[trblxy])?-(?:0|[1-5]|10|15|20)$/u
const LEGACY_UTILITY = /^(?:(?:xs|sm|md|lg|xl|2xl):)?(?:hidden|block|flex|grid|list-none|aspect-(?:video|square)|text-muted|m-auto|mx-auto|(?:grid-cols|columns|col-span)-[1-9][0-9]*|basis-(?:full|1\/[1-9][0-9]*)|gap-(?:[0-9]|1[0-9]|20)|space-y-(?:[1-9]|10|20)|(?:p|m)(?:[trblxy])?-(?:0|[1-5]|10|15|20)|(?:max-)?w-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl))$/u

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function manifestRevision(manifest: PresentationManifest): string {
  const { revision: _revision, ...payload } = manifest

  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)))
    .digest('hex')
}

export function parsePresentationManifest(input: unknown): PresentationManifest {
  const result = v.safeParse(presentationManifestSchema, input)

  if (!result.success) {
    throw new Error(`Invalid CMS presentation manifest: ${result.issues[0]?.message || 'schema mismatch'}`)
  }
  if (manifestRevision(result.output) !== result.output.revision) {
    throw new Error('Invalid CMS presentation manifest: revision hash mismatch')
  }
  return result.output
}

async function readSource(source: string, apiKey?: string): Promise<string> {
  if (/^https?:\/\//u.test(source)) {
    const response = await fetch(source, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`CMS presentation manifest request failed (${response.status})`)
    }
    return response.text()
  }
  return readFile(source, 'utf8')
}

export async function loadPresentationManifest(options: {
  source?: string
  apiKey?: string
  lastKnownPath?: string
}): Promise<PresentationManifest> {
  if (!options.source) throw new Error('CMS presentation manifest source is required')

  let source: string

  try {
    source = await readSource(options.source, options.apiKey)
  } catch (error) {
    if (!options.lastKnownPath) throw error
    source = await readSource(options.lastKnownPath)
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_MANIFEST_BYTES) {
    throw new Error('Invalid CMS presentation manifest: payload exceeds 2 MB')
  }
  return parsePresentationManifest(JSON.parse(source))
}

function prefix(breakpoint: string): string {
  if (!BREAKPOINTS.has(breakpoint)) {
    throw new Error(`Unsupported presentation breakpoint: ${breakpoint}`)
  }
  return breakpoint === 'default' ? '' : `${breakpoint}:`
}

function addLayoutReserve(classes: Set<string>, capabilities: string[]): void {
  classes.add('grid')
  classes.add('grid-cols-1')
  if (!capabilities.includes('layout')) return
  for (const utility of [
    'sm:grid-cols-2', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'sm:gap-4', 'lg:gap-6', 'lg:gap-8',
    'lg:grid-cols-[8fr_4fr]', 'lg:grid-cols-[4fr_8fr]',
  ]) classes.add(utility)
}

function addSpacing(classes: Set<string>, value: string): void {
  if (!SPACING.test(value)) throw new Error(`Unsupported semantic spacing value: ${value}`)
  if (value.endsWith('-20')) {
    classes.add(value.replace(/-20$/u, '-10'))
    classes.add(`lg:${value}`)
    return
  }
  classes.add(value)
}

export function presentationUtilities(
  manifest: PresentationManifest,
  mode: Exclude<PresentationManifestMode, 'compatibility'> = 'hybrid',
): string[] {
  if (manifest.diagnostics.rejectedLegacyClassCount > 0) {
    throw new Error(
      `CMS presentation manifest reports ${manifest.diagnostics.rejectedLegacyClassCount} rejected legacy utilities`,
    )
  }
  const classes = new Set<string>()

  addLayoutReserve(classes, manifest.capabilities)

  for (const [breakpoint, values] of Object.entries(manifest.used.grid.columns)) {
    for (const value of values) {
      if (value < 1 || value > 12) throw new Error(`Unsupported grid column count: ${value}`)
      classes.add(`${prefix(breakpoint)}grid-cols-${value}`)
    }
  }
  for (const [breakpoint, values] of Object.entries(manifest.used.grid.gap)) {
    for (const value of values) {
      if (value < 0 || value > 20) throw new Error(`Unsupported grid gap: ${value}`)
      classes.add(`${prefix(breakpoint)}gap-${value}`)
    }
  }
  for (const value of manifest.used.spacing) addSpacing(classes, value)

  const widthRecipes: Record<string, string[]> = {
    'w-xs': ['m-auto', 'sm:max-w-lg'],
    'w-sm': ['m-auto', 'lg:max-w-2xl'],
    'w-md': ['m-auto', 'lg:max-w-3xl'],
    'w-lg': ['m-auto', 'lg:max-w-4xl'],
    'w-xl': ['m-auto', 'lg:max-w-5xl'],
    'w-2xl': ['m-auto', 'lg:max-w-6xl'],
  }

  for (const value of manifest.used.width) {
    const recipe = widthRecipes[value]

    if (!recipe) throw new Error(`Unsupported semantic width value: ${value}`)
    recipe.forEach(utility => classes.add(utility))
  }

  const alignmentRecipes: Record<string, string> = {
    justify_left: 'justify-start', justify_center: 'justify-center', justify_right: 'justify-end',
    align_top: 'items-start', align_center: 'items-center', align_bottom: 'items-end',
    text_left: 'text-start', text_center: 'text-center', text_right: 'text-end',
  }

  for (const value of manifest.used.alignment) {
    const utility = alignmentRecipes[value]

    if (!utility) throw new Error(`Unsupported semantic alignment value: ${value}`)
    classes.add(utility)
    if (utility.startsWith('justify-') || utility.startsWith('items-')) classes.add('md:flex')
  }

  for (const utility of manifest.legacyClasses) {
    if (!LEGACY_UTILITY.test(utility) || utility.includes('[')) {
      throw new Error(`Rejected legacy presentation utility: ${utility}`)
    }
    classes.add(utility)
  }

  if (mode === 'hybrid') {
    for (const utility of ['gap-4', 'lg:gap-6', 'p-4', 'py-10', 'lg:py-20', 'mx-auto']) {
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
 * Builds the exact Tailwind source artifact and its mode-aware identity.
 *
 * The upstream manifest revision identifies Drupal content usage. The source
 * revision additionally identifies the generation policy, preventing strict
 * and hybrid builds from sharing a cache artifact accidentally.
 */
export function buildPresentationSource(
  manifest: PresentationManifest,
  mode: Exclude<PresentationManifestMode, 'compatibility'>,
): {
  source: string
  sourceRevision: string
  utilityCount: number
} {
  const utilities = presentationUtilities(manifest, mode)
  const source = inlinePresentationSource(utilities)
  const sourceRevision = createHash('sha256')
    .update(mode)
    .update('\0')
    .update(source)
    .digest('hex')

  return { source, sourceRevision, utilityCount: utilities.length }
}
