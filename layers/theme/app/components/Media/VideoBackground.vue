<script setup lang="ts">
import { useElementVisibility } from '@vueuse/core'
import { useDeferredVideoSource } from '#stir/composables/useDeferredVideoSource'
import { useVideoPlayers } from '#stir/composables/useVideoPlayers'
import type { resolveHeroVideoSource } from '../../utils/heroVideoSource'

// The decorative background mode of MediaVideo, used by heroes and bare
// layouts: a poster, then a muted looping video or remote player once the
// deferred source policy allows it, paused while off screen.
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  source?: ReturnType<typeof resolveHeroVideoSource>
  mid?: string | number
  title?: string
  alt?: string
  posterSrc?: string
  width?: number
  height?: number
  originalRevision?: string
  originalSrc?: string
  deliverySizes?: string
  deliveryProfile?: string
  loading?: 'eager' | 'lazy'
  fetchpriority?: 'high' | 'low' | 'auto'
  isHero?: boolean
  loadStrategy?: 'after-load' | 'immediate'
  loadMinWidth?: number
  pauseWhenHidden?: boolean
}>()

const mediaTheme = useAppConfig().stirTheme.media
const { initializePlayers, registerIframe, videoPlayers } = useVideoPlayers()
const videoElement = ref<HTMLVideoElement | null>(null)
const iframeElement = ref<HTMLIFrameElement | null>(null)
const resolvedPosterSrc = ref<string>()
const backgroundPlayerId = useId()
const playerKey = computed(() =>
  props.mid === undefined ? `background-${backgroundPlayerId}` : String(props.mid),
)
const directSrc = computed(() => props.source?.kind === 'direct' ? props.source.src : undefined)
const remoteSrc = computed(() => props.source?.kind === 'embed' ? props.source.src : undefined)
const loadStrategy = computed<'after-load' | 'immediate'>(() =>
  (props.loadStrategy ?? mediaTheme.video?.loadStrategy) === 'immediate' ? 'immediate' : 'after-load',
)
const loadMinWidth = computed(() => props.loadMinWidth ?? mediaTheme.video?.loadMinWidth ?? 0)
const { isActive: isSourceActive } = useDeferredVideoSource({
  enabled: true,
  minWidth: loadMinWidth,
  source: () => props.source?.src,
  strategy: loadStrategy,
  videoElement,
})
const directTarget = computed(() => props.pauseWhenHidden ? videoElement.value : null)
const remoteTarget = computed(() => props.pauseWhenHidden ? iframeElement.value : null)
const isDirectVisible = useElementVisibility(directTarget, { threshold: 0.1 })
const isRemoteVisible = useElementVisibility(remoteTarget, { threshold: 0.1 })

watch(() => props.posterSrc, () => { resolvedPosterSrc.value = undefined })

async function initializeRemotePlayer(): Promise<void> {
  await nextTick()

  if (iframeElement.value) {
    await registerIframe(iframeElement.value)
    return
  }

  await initializePlayers()
}

watch(
  [remoteSrc, isSourceActive, iframeElement],
  ([source, active, iframe]) => {
    if (source && active && iframe) void initializeRemotePlayer()
  },
  { flush: 'post', immediate: true },
)

watch([isDirectVisible, directTarget, isSourceActive], ([visible]) => {
  if (!props.pauseWhenHidden || !videoElement.value) return

  if (visible && isSourceActive.value) {
    void videoElement.value.play().catch(() => {})
    return
  }

  videoElement.value.pause()
}, {
  flush: 'post',
  immediate: true,
})

watchEffect(() => {
  const visible = isRemoteVisible.value

  if (!props.pauseWhenHidden) return

  const player = videoPlayers.value.get(playerKey.value)

  if (!player?.isReady) return

  const method = visible ? 'play' : 'pause'

  if (player.supports('method', method)) player[method]()
})
</script>

<template>
  <MediaImage
    v-if="posterSrc"
    v-bind="$attrs"
    :alt="alt || ''"
    aria-hidden="true"
    :delivery-profile="deliveryProfile"
    :delivery-sizes="deliverySizes"
    :fetchpriority="fetchpriority"
    :height="height"
    image-class="absolute inset-0 h-full w-full object-cover"
    :is-hero="isHero"
    :loading="loading"
    no-wrapper
    :original-revision="originalRevision"
    :original-src="originalSrc"
    :src="posterSrc"
    :width="width"
    @resolved-src="resolvedPosterSrc = $event"
  />

  <video
    v-if="directSrc"
    ref="videoElement"
    v-bind="$attrs"
    aria-hidden="true"
    autoplay
    class="pointer-events-none absolute inset-0 h-full w-full object-cover"
    disablepictureinpicture
    disableremoteplayback
    loop
    muted
    playsinline
    :poster="resolvedPosterSrc"
    :preload="isSourceActive ? 'metadata' : 'none'"
    tabindex="-1"
  >
    <source
      v-if="isSourceActive"
      :src="directSrc"
    />
  </video>

  <iframe
    v-if="remoteSrc && isSourceActive"
    ref="iframeElement"
    allow="autoplay; encrypted-media; picture-in-picture"
    aria-hidden="true"
    class="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
    :data-mid="playerKey"
    :src="remoteSrc"
    tabindex="-1"
    :title="title || 'Background video'"
  />
</template>
