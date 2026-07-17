import { computed, unref } from 'vue'
import type { ImgHTMLAttributes } from 'vue'

type TeaserImage = Partial<ImgHTMLAttributes> & {
  originalRevision?: string
  originalSrc?: string
  responsiveStyle?: string
}

const nodeEditPathPattern = /^\/node\/\d+\/edit\/?$/

export function useTeaserPost(
  input: unknown,
  extra: {
    title?: string
    url?: string
    created?: string
    orientation?: 'horizontal' | 'vertical'
    editLink?: string
  } = {},
) {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

  const formatCreatedDate = (value: unknown) => {
    if (value === null || value === undefined || value === '') return ''

    const raw = typeof value === 'string' ? value.trim() : value

    if (raw === '') return ''

    const asNumber = Number(raw)

    if (Number.isFinite(asNumber) && asNumber > 0) {
      return new Date(asNumber * 1000).toISOString().slice(0, 10)
    }

    const parsed = new Date(String(raw))

    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }

  const teaserSource = computed(() => {
    const source = unref(input)
    const raw = isRecord(source) ? source : {}
    const props = isRecord(raw.props) ? raw.props : {}
    const rawMedia = Array.isArray(raw.media)
      ? raw.media.find(isRecord)
      : raw.media
    const rawMediaRecord = isRecord(rawMedia) ? rawMedia : {}
    const rawMediaProps = isRecord(rawMediaRecord.props) ? rawMediaRecord.props : {}
    const media = isRecord(rawMediaProps) && Object.keys(rawMediaProps).length > 0
      ? rawMediaProps
      : isRecord(rawMedia)
        ? rawMedia
        : isRecord(props.media)
          ? props.media
          : {}
    const text = typeof raw.text === 'string'
      ? raw.text
      : typeof props.text === 'string'
        ? props.text
        : ''

    return {
      props,
      media,
      text,
    }
  })

  const orientation = computed(() => extra.orientation ?? 'horizontal')
  const image = computed(() => {
    const m = teaserSource.value.media

    if (typeof m.src !== 'string' || m.src.trim() === '') return undefined

    const media = m as Record<string, unknown>
    const width = typeof media.width === 'number'
      ? media.width
      : Number(media.width)
    const height = typeof media.height === 'number'
      ? media.height
      : Number(media.height)

    return {
      src: m.src,
      alt: typeof media.alt === 'string' ? media.alt : extra.title ?? '',
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
      originalRevision: typeof media.originalRevision === 'string'
        ? media.originalRevision
        : undefined,
      originalSrc: typeof media.originalSrc === 'string'
        ? media.originalSrc
        : undefined,
      responsiveStyle: typeof media.responsiveStyle === 'string'
        ? media.responsiveStyle
        : undefined,
      srcset: typeof media.srcset === 'string' ? media.srcset : undefined,
      sizes: typeof media.sizes === 'string' ? media.sizes : '(min-width: 768px) 50vw, 100vw',
      loading: 'lazy',
      fetchpriority: 'low',
      decoding: 'async',
    } satisfies TeaserImage
  })

  const resolveEditLink = (value: unknown) =>
    typeof value === 'string' ? value.trim() : ''
  const resolveNodeEditLink = (value: unknown) => {
    const link = resolveEditLink(value)

    if (!link) return ''

    try {
      const url = new URL(link, 'https://drupal.local')

      return nodeEditPathPattern.test(url.pathname) ? link : ''
    }
    catch {
      return ''
    }
  }

  const backendEditLink = computed(() => {
    const source = unref(input)
    const sourceRecord = isRecord(source) ? source : {}
    const sourceProps = isRecord(sourceRecord.props) ? sourceRecord.props : {}
    const rootLink = resolveNodeEditLink(extra.editLink)
    const sourceLink =
      resolveNodeEditLink(sourceRecord.editLink)
      || resolveNodeEditLink(sourceProps.editLink)

    return rootLink || sourceLink || undefined
  })

  const post = computed(() => ({
    title: extra.title ?? '',
    description: teaserSource.value.text ?? '',
    image: image.value,
    date: formatCreatedDate(extra.created),
    to: extra.url ?? '',
    editLink: backendEditLink.value,
  }))

  return { teaser: teaserSource, image, post, orientation }
}
