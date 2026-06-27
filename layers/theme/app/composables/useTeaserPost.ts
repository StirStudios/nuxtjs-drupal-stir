import { computed, unref } from 'vue'
import type { ImgHTMLAttributes } from 'vue'

type TeaserImage = Partial<ImgHTMLAttributes>

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
    const media = isRecord(raw.media) ? raw.media : {}
    const text = typeof raw.text === 'string' ? raw.text : ''

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
      srcset: typeof media.srcset === 'string' ? media.srcset : undefined,
      sizes: typeof media.sizes === 'string' ? media.sizes : '(min-width: 768px) 50vw, 100vw',
      loading: 'lazy',
      fetchpriority: 'low',
      decoding: 'async',
    } satisfies TeaserImage
  })

  const resolveEditLink = (value: unknown) =>
    typeof value === 'string' ? value.trim() : ''

  const isNodeEditLink = (value: string) =>
    /(?:^|\/)node\/\d+\/edit(?:$|[?#])/i.test(value)

  const backendEditLink = computed(() => {
    const source = unref(input)
    const sourceRecord = isRecord(source) ? source : {}
    const sourceProps = isRecord(sourceRecord.props) ? sourceRecord.props : {}
    const rootLink = resolveEditLink(extra.editLink)
    const sourceLink =
      resolveEditLink(sourceRecord.editLink)
      || resolveEditLink(sourceProps.editLink)

    if (rootLink.length > 0 && isNodeEditLink(rootLink)) return rootLink
    if (sourceLink.length > 0 && isNodeEditLink(sourceLink)) return sourceLink

    return undefined
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
