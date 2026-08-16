import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import * as v from 'valibot'

const breakpointSchema = v.record(
  v.string(),
  v.array(v.pipe(v.number(), v.integer())),
)

const presentationManifestSchema = v.strictObject({
  schemaVersion: v.literal(2),
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
    rejectedLegacyClasses: v.optional(v.array(v.string())),
  }),
  revision: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
})

export type PresentationManifest = v.InferOutput<typeof presentationManifestSchema>

export function resolvePresentationManifestSource(options: {
  source?: string
  useFixture?: boolean
  fixturePath: string
  repositoryBuild?: boolean
  drupalUrl?: string
}): string | undefined {
  if (options.source) return options.source
  if (options.useFixture || options.repositoryBuild) return options.fixturePath
  return options.drupalUrl
    ? `${options.drupalUrl.replace(/\/$/u, '')}/ce-api/stir-layout-builder/presentation-manifest`
    : undefined
}

const BREAKPOINTS = new Set(['default', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024
const DEFAULT_RETRY_ATTEMPTS = 46
const DEFAULT_RETRY_DELAY_MS = 2_000
const DEFAULT_RETRY_MAX_WAIT_MS = 90_000
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const SPACING = /^(?:p|m)(?:[trblxy])?-(?:0|[1-5]|8|10|15|20)$/u
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

type PresentationManifestRetryOptions = {
  attempts?: number
  delayMs?: number
  maxWaitMs?: number
  onRetry?: (message: string) => void
}

class PresentationManifestRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function readRemoteSource(
  source: string,
  apiKey?: string,
  timeoutMs = 15_000,
): Promise<string> {
  let response: Response

  try {
    response = await fetch(source, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : ''

    throw new PresentationManifestRequestError(
      `CMS presentation manifest request failed${detail}`,
      true,
    )
  }

  if (!response.ok) {
    throw new PresentationManifestRequestError(
      `CMS presentation manifest request failed (${response.status})`,
      RETRYABLE_HTTP_STATUSES.has(response.status),
    )
  }
  return response.text()
}

async function readSource(
  source: string,
  apiKey?: string,
  retry: PresentationManifestRetryOptions = {},
): Promise<string> {
  if (/^https?:\/\//u.test(source)) {
    const attempts = Math.max(1, retry.attempts ?? DEFAULT_RETRY_ATTEMPTS)
    const retryDelayMs = Math.max(0, retry.delayMs ?? DEFAULT_RETRY_DELAY_MS)
    const maxWaitMs = Math.max(1, retry.maxWaitMs ?? DEFAULT_RETRY_MAX_WAIT_MS)
    const startedAt = Date.now()

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const elapsedMs = Date.now() - startedAt
      const remainingMs = maxWaitMs - elapsedMs

      try {
        return await readRemoteSource(
          source,
          apiKey,
          Math.max(1, Math.min(15_000, remainingMs)),
        )
      } catch (error) {
        const remainingAfterFailureMs = maxWaitMs - (Date.now() - startedAt)
        const canRetry = error instanceof PresentationManifestRequestError
          && error.retryable
          && attempt < attempts
          && remainingAfterFailureMs > retryDelayMs

        if (!canRetry) {
          if (error instanceof PresentationManifestRequestError && error.retryable) {
            throw new Error(
              `${error.message} after ${attempt} attempt${attempt === 1 ? '' : 's'}`,
              { cause: error },
            )
          }
          throw error
        }
        retry.onRetry?.(
          `${error.message}; retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${attempts})`,
        )
        await delay(retryDelayMs)
      }
    }
  }
  return readFile(source, 'utf8')
}

export async function loadPresentationManifest(options: {
  source?: string
  apiKey?: string
  lastKnownPath?: string
  retry?: PresentationManifestRetryOptions
}): Promise<PresentationManifest> {
  if (!options.source) throw new Error('CMS presentation manifest source is required')

  let source: string

  try {
    source = await readSource(options.source, options.apiKey, options.retry)
  } catch (error) {
    if (!options.lastKnownPath) throw error
    source = await readSource(options.lastKnownPath)
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_MANIFEST_BYTES) {
    throw new Error('Invalid CMS presentation manifest: payload exceeds 2 MB')
  }
  return parsePresentationManifest(JSON.parse(source))
}

type PresentationWarningHandler = (message: string) => void

function prefix(breakpoint: string): string | undefined {
  if (!BREAKPOINTS.has(breakpoint)) {
    return undefined
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

function addSpacing(
  classes: Set<string>,
  value: string,
  warn: PresentationWarningHandler,
): void {
  for (const utility of value.split(/\s+/u).filter(Boolean)) {
    if (!isSafeClassToken(utility)) {
      warn(`Ignored unsafe CMS presentation class token: ${utility}`)
      continue
    }
    if (SPACING.test(utility) && utility.endsWith('-20')) {
      classes.add(utility.replace(/-20$/u, '-10'))
      classes.add(`lg:${utility}`)
      continue
    }
    classes.add(utility)
  }
}

function addLiteralUtilities(
  classes: Set<string>,
  value: string,
  warn: PresentationWarningHandler,
): void {
  for (const utility of value.split(/\s+/u).filter(Boolean)) {
    if (!isSafeClassToken(utility)) {
      warn(`Ignored unsafe CMS presentation class token: ${utility}`)
      continue
    }
    classes.add(utility)
  }
}

export function presentationUtilities(
  manifest: PresentationManifest,
  options: { warn?: PresentationWarningHandler } = {},
): string[] {
  const classes = new Set<string>()
  const warn = options.warn || (() => {})

  addLayoutReserve(classes, manifest.capabilities)

  for (const [breakpoint, values] of Object.entries(manifest.used.grid.columns)) {
    const variant = prefix(breakpoint)

    if (variant === undefined) {
      warn(`Ignored unsupported presentation breakpoint: ${breakpoint}`)
      continue
    }
    for (const value of values) {
      if (value < 1 || value > 12) {
        warn(`Ignored unsupported grid column count: ${value}`)
        continue
      }
      classes.add(`${variant}grid-cols-${value}`)
      classes.add(`${variant}${value === 1 ? 'basis-full' : `basis-1/${value}`}`)
    }
  }
  for (const [breakpoint, values] of Object.entries(manifest.used.grid.gap)) {
    const variant = prefix(breakpoint)

    if (variant === undefined) {
      warn(`Ignored unsupported presentation breakpoint: ${breakpoint}`)
      continue
    }
    for (const value of values) {
      if (value < 0 || value > 20) {
        warn(`Ignored unsupported grid gap: ${value}`)
        continue
      }
      classes.add(`${variant}gap-${value}`)
    }
  }
  for (const value of manifest.used.spacing) addSpacing(classes, value, warn)

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

    if (!recipe) {
      addLiteralUtilities(classes, value, warn)
      continue
    }
    recipe.forEach(utility => classes.add(utility))
  }

  const alignmentRecipes: Record<string, string> = {
    justify_left: 'justify-start', justify_center: 'justify-center', justify_right: 'justify-end',
    align_top: 'items-start', align_center: 'items-center', align_bottom: 'items-end',
    text_left: 'text-start', text_center: 'text-center', text_right: 'text-end',
  }

  for (const value of manifest.used.alignment) {
    const utility = alignmentRecipes[value]

    if (!utility) {
      addLiteralUtilities(classes, value, warn)
      continue
    }
    classes.add(utility)
    if (utility.startsWith('justify-') || utility.startsWith('items-')) classes.add('md:flex')
  }

  for (const utility of manifest.legacyClasses) {
    if (!isSafeClassToken(utility)) {
      warn(`Ignored unsafe CMS presentation class token: ${utility}`)
      continue
    }
    classes.add(utility)
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
 * Builds the exact Tailwind source artifact and its identity.
 *
 * The upstream manifest revision identifies Drupal content usage. The source
 * revision additionally identifies the generated Tailwind source.
 */
export function buildPresentationSource(
  manifest: PresentationManifest,
  options: { warn?: PresentationWarningHandler } = {},
): {
  source: string
  sourceRevision: string
  utilityCount: number
  manifestUsageCount: number
  legacyUtilityCount: number
  rejectedLegacyUtilityCount: number
  sourceBytes: number
} {
  const utilities = presentationUtilities(manifest, options)
  const source = inlinePresentationSource(utilities)
  const sourceRevision = createHash('sha256')
    .update(source)
    .digest('hex')
  const gridUsageCount = Object.values(manifest.used.grid.columns)
    .reduce((count, values) => count + values.length, 0)
    + Object.values(manifest.used.grid.gap)
      .reduce((count, values) => count + values.length, 0)
  const manifestUsageCount = gridUsageCount
    + manifest.used.spacing.length
    + manifest.used.width.length
    + manifest.used.alignment.length
    + manifest.legacyClasses.length
    + (manifest.used.grid.matrix ? 1 : 0)

  return {
    source,
    sourceRevision,
    utilityCount: utilities.length,
    manifestUsageCount,
    legacyUtilityCount: manifest.legacyClasses.length,
    rejectedLegacyUtilityCount: manifest.diagnostics.rejectedLegacyClassCount,
    sourceBytes: Buffer.byteLength(source, 'utf8'),
  }
}
