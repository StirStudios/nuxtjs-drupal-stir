export type HeroVideoSource =
  | { kind: 'direct', src: string }
  | { kind: 'embed', src: string }

const DIRECT_VIDEO_EXTENSION = /\.(?:m3u8|m4v|mov|mp4|og[gv]|webm)$/i

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

const VIMEO_HOSTS = new Set([
  'player.vimeo.com',
  'vimeo.com',
  'www.vimeo.com',
])

const BUNNY_EMBED_HOSTS = new Set([
  'iframe.mediadelivery.net',
  'player.mediadelivery.net',
])

function normalizedUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  }
  catch {
    return undefined
  }
}

export function isDirectVideoFile(value: string | undefined): boolean {
  const source = value?.trim()

  if (!source) return false

  try {
    return DIRECT_VIDEO_EXTENSION.test(new URL(source, 'https://local.invalid').pathname)
  }
  catch {
    return DIRECT_VIDEO_EXTENSION.test(source.split(/[?#]/, 1)[0] ?? '')
  }
}

function backgroundEmbedUrl(url: URL): string | undefined {
  if (BUNNY_EMBED_HOSTS.has(url.hostname) && url.pathname.startsWith('/embed/')) {
    return url.toString()
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const videoId = url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1]

    if (!videoId) return undefined

    url.pathname = `/embed/${videoId}`
    url.searchParams.set('autoplay', '1')
    url.searchParams.set('controls', '0')
    url.searchParams.set('loop', '1')
    url.searchParams.set('mute', '1')
    url.searchParams.set('playsinline', '1')
    url.searchParams.set('playlist', videoId)
    return url.toString()
  }

  if (VIMEO_HOSTS.has(url.hostname) && /\/video\/[^/]+/.test(url.pathname)) {
    url.searchParams.set('autoplay', '1')
    url.searchParams.set('background', '1')
    url.searchParams.set('controls', '0')
    url.searchParams.set('loop', '1')
    url.searchParams.set('muted', '1')
    return url.toString()
  }

  return undefined
}

export function resolveHeroVideoSource(value: string | undefined): HeroVideoSource | undefined {
  const source = value?.trim()

  if (!source) return undefined

  const url = normalizedUrl(source)
  const embed = url ? backgroundEmbedUrl(url) : undefined

  return embed
    ? { kind: 'embed', src: embed }
    : { kind: 'direct', src: source }
}
