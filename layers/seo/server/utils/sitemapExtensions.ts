import type { H3Event } from 'h3'
import {
  array,
  boolean,
  check,
  getDotPath,
  integer,
  looseObject,
  maxValue,
  minLength,
  minValue,
  number,
  optional,
  picklist,
  pipe,
  safeParse,
  strictObject,
  string,
  union,
} from 'valibot'
import type {
  SitemapEntry,
  SitemapExtensionEntry,
  SitemapProducerPayload,
} from '../../shared/types/sitemap'
import { sitemapCanonicalKey } from '../../../../config/sitemapCanonicalKey'

export const STIR_SITEMAP_EXTEND_HOOK = 'stir:sitemap:extend'

/** Each handler gets its own context and pushes entries onto `entries`. */
export interface StirSitemapExtendContext {
  event: H3Event
  entries: SitemapExtensionEntry[]
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'stir:sitemap:extend': (context: StirSitemapExtendContext) => void | Promise<void>
  }
}

const absoluteUrl = pipe(
  string(),
  check((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, 'Expected an absolute http(s) URL'),
)
const yesNo = optional(union([boolean(), picklist(['yes', 'no'])]))

const imageSchema = strictObject({
  loc: absoluteUrl,
  caption: optional(string()),
  title: optional(string()),
  geo_location: optional(string()),
  license: optional(absoluteUrl),
})

const videoSchema = pipe(
  looseObject({
    title: pipe(string(), minLength(1)),
    description: pipe(string(), minLength(1)),
    thumbnail_loc: absoluteUrl,
    content_loc: optional(absoluteUrl),
    player_loc: optional(absoluteUrl),
    duration: optional(pipe(number(), integer(), minValue(1), maxValue(28_800))),
    publication_date: optional(string()),
    expiration_date: optional(string()),
    family_friendly: yesNo,
    requires_subscription: yesNo,
    live: yesNo,
  }),
  check(
    video => Boolean(video.content_loc || video.player_loc),
    'Expected content_loc or player_loc',
  ),
)

const extensionEntrySchema = strictObject({
  loc: absoluteUrl,
  images: optional(array(imageSchema)),
  videos: optional(array(videoSchema)),
})

const warn = (message: string, detail?: unknown): void => {
  console.warn(`[stir:sitemap] ${message}`, ...(detail === undefined ? [] : [detail]))
}

/** Keeps valid extension entries and drops invalid ones with a warning. */
export function parseSitemapExtensionEntries(
  value: unknown,
  source: string,
): SitemapExtensionEntry[] {
  if (!Array.isArray(value)) {
    warn(`Ignoring ${source}: expected an array of entries.`)

    return []
  }

  return value.flatMap((entry, index) => {
    const result = safeParse(extensionEntrySchema, entry)

    if (result.success) return [result.output as SitemapExtensionEntry]

    const path = getDotPath(result.issues[0])

    warn(`Dropping invalid ${source} entry ${index}${path ? ` at ${path}` : ''}: ${result.issues[0].message}`)

    return []
  })
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Timed out after ${timeoutMs}ms`)),
        timeoutMs,
      )
    }),
  ]).finally(() => clearTimeout(timer))
}

/**
 * Runs every `stir:sitemap:extend` handler in parallel. A throwing, timed-out,
 * or malformed handler is logged and contributes nothing.
 */
export async function resolveSitemapExtensions(
  event: H3Event,
  timeoutMs: number,
): Promise<SitemapExtensionEntry[]> {
  const results = await useNitroApp().hooks.callHookWith(
    hooks => Promise.allSettled(hooks.map((hook) => {
      const context: StirSitemapExtendContext = { event, entries: [] }

      return withTimeout(
        Promise.resolve().then(() => hook(context)).then(() => context.entries as unknown),
        timeoutMs,
      )
    })),
    STIR_SITEMAP_EXTEND_HOOK,
    { event, entries: [] },
  )

  return results.flatMap((result, index) => {
    const source = `${STIR_SITEMAP_EXTEND_HOOK} handler ${index}`

    if (result.status === 'rejected') {
      warn(`Ignoring ${source}: it failed.`, result.reason)

      return []
    }

    return parseSitemapExtensionEntries(result.value, source)
  })
}

/** Adds extension images and videos to matching Drupal URLs; unmatched entries are ignored. */
export function mergeSitemapExtensions(
  entries: SitemapProducerPayload,
  extensions: SitemapExtensionEntry[],
): SitemapEntry[] {
  if (extensions.length === 0) return entries

  const byKey = new Map<string, Required<Pick<SitemapEntry, 'images' | 'videos'>>>()

  for (const extension of extensions) {
    const key = sitemapCanonicalKey(extension.loc)

    if (key === null) continue

    const fields = byKey.get(key) ?? { images: [], videos: [] }

    fields.images.push(...(extension.images ?? []))
    fields.videos.push(...(extension.videos ?? []))
    byKey.set(key, fields)
  }

  return entries.map((entry) => {
    const key = sitemapCanonicalKey(entry.loc)
    const fields = key === null ? undefined : byKey.get(key)

    if (!fields) return entry

    return {
      ...entry,
      ...(fields.images.length ? { images: fields.images } : {}),
      ...(fields.videos.length ? { videos: fields.videos } : {}),
    }
  })
}
