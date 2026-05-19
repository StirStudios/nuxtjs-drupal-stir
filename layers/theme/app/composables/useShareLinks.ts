import type { MaybeRefOrGetter } from 'vue'
import { computed, onMounted, ref, toValue } from 'vue'

export type ShareNetwork = 'native' | 'x' | 'facebook' | 'linkedin' | 'email' | 'copy'

export type ShareLinkOptions = {
  url?: MaybeRefOrGetter<string | undefined>
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  networks?: MaybeRefOrGetter<ShareNetwork[] | undefined>
}

export type ShareLinkItem = {
  network: ShareNetwork
  label: string
  icon: string
  href?: string
}

const DEFAULT_NETWORKS: ShareNetwork[] = [
  'native',
  'x',
  'facebook',
  'linkedin',
  'email',
  'copy',
]
const SHARE_NETWORKS = new Set<ShareNetwork>(DEFAULT_NETWORKS)

const NETWORK_META: Record<ShareNetwork, Omit<ShareLinkItem, 'network' | 'href'>> = {
  native: {
    label: 'Share',
    icon: 'i-lucide-share-2',
  },
  x: {
    label: 'Share on X',
    icon: 'i-lucide-message-circle',
  },
  facebook: {
    label: 'Share on Facebook',
    icon: 'i-lucide-share',
  },
  linkedin: {
    label: 'Share on LinkedIn',
    icon: 'i-lucide-briefcase-business',
  },
  email: {
    label: 'Share by email',
    icon: 'i-lucide-mail',
  },
  copy: {
    label: 'Copy link',
    icon: 'i-lucide-copy',
  },
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isShareNetwork(value: unknown): value is ShareNetwork {
  return typeof value === 'string' && SHARE_NETWORKS.has(value as ShareNetwork)
}

function resolveNetworks(networks?: ShareNetwork[]): ShareNetwork[] {
  const resolved = networks?.filter(isShareNetwork) ?? DEFAULT_NETWORKS

  return [...new Set(resolved)]
}

function resolveAbsoluteUrl(value: string, origin: string): string {
  try {
    return new URL(value || '/', origin).toString()
  }
  catch {
    return new URL('/', origin).toString()
  }
}

function emailBody(title: string, description: string, url: string): string {
  return [title, description, url].filter(Boolean).join('\n\n')
}

function shareHref(network: ShareNetwork, title: string, description: string, url: string): string | undefined {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}${title ? `&text=${encodedTitle}` : ''}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    case 'email':
      return `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(emailBody(title, description, url))}`
    default:
      return undefined
  }
}

export function useShareLinks(options: ShareLinkOptions = {}) {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const copied = ref(false)
  const isNativeShareSupported = ref(false)

  const shareUrl = computed(() => {
    const configuredUrl = cleanString(toValue(options.url))
    const fallbackPath = route.fullPath || '/'

    return resolveAbsoluteUrl(configuredUrl || fallbackPath, requestUrl.origin)
  })

  const shareTitle = computed(() => {
    const configuredTitle = cleanString(toValue(options.title))
    const routeTitle = cleanString(route.meta.title)

    return configuredTitle || routeTitle
  })

  const shareDescription = computed(() => cleanString(toValue(options.description)))
  const networks = computed(() => resolveNetworks(toValue(options.networks)))
  const items = computed<ShareLinkItem[]>(() => networks.value.map((network) => ({
    network,
    ...NETWORK_META[network],
    href: shareHref(network, shareTitle.value, shareDescription.value, shareUrl.value),
  })))

  async function copyLink() {
    if (!import.meta.client || !navigator.clipboard?.writeText) return

    try {
      await navigator.clipboard.writeText(shareUrl.value)
      copied.value = true
      window.setTimeout(() => {
        copied.value = false
      }, 1800)
    } catch (err) {
      console.error('Unable to copy share link:', err)
    }
  }

  async function share(network: ShareNetwork) {
    if (!import.meta.client) return

    if (network === 'copy') {
      await copyLink()
      return
    }

    if (network === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle.value || undefined,
          text: shareDescription.value || undefined,
          url: shareUrl.value,
        })
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('Unable to share link:', err)
        }
      }

      return
    }

    const href = shareHref(network, shareTitle.value, shareDescription.value, shareUrl.value)

    if (!href) return

    if (network === 'email') {
      window.location.href = href
      return
    }

    window.open(href, 'share', 'noopener,noreferrer,width=720,height=640')
  }

  onMounted(() => {
    isNativeShareSupported.value = Boolean(navigator.share)
  })

  return {
    copied,
    isNativeShareSupported,
    items,
    networks,
    share,
    shareDescription,
    shareTitle,
    shareUrl,
  }
}
