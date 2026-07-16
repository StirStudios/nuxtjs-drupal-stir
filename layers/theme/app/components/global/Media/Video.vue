<script setup lang="ts">
import { mediaPreviewClasses } from '#stir/utils/mediaPreviewClasses'
import { useDeferredVideoSource } from '#stir/composables/useDeferredVideoSource'
import { useVideoPlayers } from '#stir/composables/useVideoPlayers'
import type { EditAction, EditActionKey } from '#stir/types/EditControls'
import { isDirectVideoFile, resolveHeroVideoSource } from '../../../utils/heroVideoSource'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    mid?: string | number
    title?: string
    alt?: string
    src?: string
    platform?: string
    mediaEmbed?: string
    previewMode?: 'static' | 'animated'
    animatedPreviewSrc?: string
    thumbnailStatus?: 'ready' | 'processing' | 'missing'
    thumbnailIsDefault?: boolean
    loadStrategy?: 'after-load' | 'immediate'
    loadMinWidth?: number

    width?: number
    height?: number
    srcset?: string
    sizes?: string
    originalSrc?: string
    originalRevision?: string
    responsiveStyle?: string
    loading?: 'eager' | 'lazy'
    fetchpriority?: 'high' | 'low' | 'auto'

    noWrapper?: boolean
    deferEmbed?: boolean
    editActions?: EditAction[]
  }>(),
  {
    mid: undefined,
    title: undefined,
    alt: undefined,
    src: undefined,
    platform: undefined,
    mediaEmbed: undefined,
    previewMode: undefined,
    animatedPreviewSrc: undefined,
    thumbnailStatus: undefined,
    thumbnailIsDefault: false,
    loadStrategy: undefined,
    loadMinWidth: undefined,
    width: undefined,
    height: undefined,
    srcset: undefined,
    sizes: undefined,
    originalSrc: undefined,
    originalRevision: undefined,
    responsiveStyle: undefined,
    loading: 'lazy',
    fetchpriority: 'auto',
    noWrapper: false,
    deferEmbed: true,
    editActions: undefined,
  },
)

const theme = useAppConfig().stirTheme
const { media: mediaTheme } = theme
const attrs = useAttrs()
const { initializePlayers, registerIframe } = useVideoPlayers()
const isHero = inject<boolean>('isHero', false)
const isBare = computed(() => isHero || props.noWrapper === true)
const videoElement = ref<HTMLVideoElement | null>(null)
const iframeElement = ref<HTMLIFrameElement | null>(null)
const localVideoSrc = computed(() => {
  if (props.mediaEmbed || !isDirectVideoFile(props.src)) return undefined

  const source = resolveHeroVideoSource(props.src)

  return source?.kind === 'direct' ? source.src : undefined
})
const playbackSource = computed(() =>
  resolveHeroVideoSource(props.mediaEmbed || localVideoSrc.value),
)
const heroVideoSource = computed(() =>
  isBare.value ? playbackSource.value : undefined,
)
const directHeroVideoSrc = computed(() =>
  heroVideoSource.value?.kind === 'direct' ? heroVideoSource.value.src : undefined,
)
const remoteHeroVideoSrc = computed(() =>
  heroVideoSource.value?.kind === 'embed' ? heroVideoSource.value.src : undefined,
)
const bareVideoLoadStrategy = computed<'after-load' | 'immediate'>(() => {
  const strategy = props.loadStrategy ?? mediaTheme.video?.loadStrategy

  return strategy === 'immediate' ? 'immediate' : 'after-load'
})
const bareVideoLoadMinWidth = computed(
  () => props.loadMinWidth ?? mediaTheme.video?.loadMinWidth ?? 768,
)
const { isActive: isBareVideoSourceActive } = useDeferredVideoSource({
  enabled: isBare,
  minWidth: bareVideoLoadMinWidth,
  source: () => heroVideoSource.value?.src,
  strategy: bareVideoLoadStrategy,
  videoElement,
})
const isProcessing = computed(() => {
  if (props.thumbnailStatus) {
    return props.thumbnailStatus === 'processing'
  }

  return props.width === 180
})
const isEmbedActive = ref(false)
const isAnimatedPreviewActive = ref(false)
const ratioConfig = {
  portrait: 'aspect-[9/16]',
  landscape: 'aspect-[16/9]',
  square: 'aspect-square',
  fourThree: 'aspect-[4/3]',
} as const
const aspectClass = computed(() => {
  const width = props.width
  const height = props.height

  if (!width || !height) return 'aspect-video'
  if (height === 480) return ratioConfig.fourThree

  const ratio = width / height

  if (ratio > 1) return ratioConfig.landscape
  if (ratio < 1) return ratioConfig.portrait
  return ratioConfig.square
})

const shouldShowIframe = computed(
  () => playbackSource.value?.kind === 'embed' && !isProcessing.value && isEmbedActive.value,
)
const shouldShowDirectVideo = computed(
  () => !isBare.value
    && playbackSource.value?.kind === 'direct'
    && !isProcessing.value
    && isEmbedActive.value,
)
const previewSrc = computed(() => {
  if (
    isAnimatedPreviewActive.value
    && props.previewMode === 'animated'
    && props.animatedPreviewSrc
  ) {
    return props.animatedPreviewSrc
  }

  return localVideoSrc.value ? undefined : props.src
})
const previewSrcset = computed(() =>
  isAnimatedPreviewActive.value ? undefined : props.srcset,
)
const previewOriginalSrc = computed(() =>
  isAnimatedPreviewActive.value ? undefined : props.originalSrc,
)
const previewOriginalRevision = computed(() =>
  isAnimatedPreviewActive.value ? undefined : props.originalRevision,
)
const previewResponsiveStyle = computed(() =>
  isAnimatedPreviewActive.value ? undefined : props.responsiveStyle,
)

const emit = defineEmits<{
  (e: 'edit-action-select', key: EditActionKey): void
}>()

async function scheduleInitializePlayers(): Promise<void> {
  await nextTick()

  if (iframeElement.value) {
    await registerIframe(iframeElement.value)
    return
  }

  await initializePlayers()
}

function activateEmbed() {
  if (shouldShowIframe.value || shouldShowDirectVideo.value) return
  isEmbedActive.value = true
  if (playbackSource.value?.kind === 'embed') {
    void scheduleInitializePlayers()
  }
}

function activateAnimatedPreview(): void {
  if (props.previewMode === 'animated' && props.animatedPreviewSrc) {
    isAnimatedPreviewActive.value = true
  }
}

function deactivateAnimatedPreview(): void {
  isAnimatedPreviewActive.value = false
}

onMounted(() => {
  if (!isBare.value && !props.deferEmbed) {
    isEmbedActive.value = true
  }

  if (!isBare.value && shouldShowIframe.value) {
    void scheduleInitializePlayers()
  }
})

watch(
  shouldShowIframe,
  (showIframe) => {
    if (!showIframe || isBare.value) return

    void scheduleInitializePlayers()
  },
  { flush: 'post' },
)
</script>

<template>
  <MediaImage
    v-if="isBare && previewSrc"
    v-bind="attrs"
    :alt="alt || ''"
    aria-hidden="true"
    :fetchpriority="fetchpriority"
    :height="height"
    image-class="absolute inset-0 h-full w-full object-cover"
    :loading="loading"
    no-wrapper
    :original-revision="previewOriginalRevision"
    :original-src="previewOriginalSrc"
    :responsive-style="previewResponsiveStyle"
    :sizes="sizes || '100vw'"
    :src="previewSrc"
    :srcset="previewSrcset"
    :width="width"
  />

  <video
    v-if="isBare && directHeroVideoSrc"
    ref="videoElement"
    v-bind="attrs"
    aria-hidden="true"
    class="absolute inset-0 h-full w-full object-cover"
    disablepictureinpicture
    loop
    muted
    playsinline
    :preload="isBareVideoSourceActive ? 'metadata' : 'none'"
  >
    <source
      v-if="isBareVideoSourceActive"
      :src="directHeroVideoSrc"
    />
  </video>

  <iframe
    v-if="isBare && remoteHeroVideoSrc && isBareVideoSourceActive"
    allow="autoplay; encrypted-media; picture-in-picture"
    aria-hidden="true"
    class="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
    :src="remoteHeroVideoSrc"
    tabindex="-1"
    :title="title || 'Background video'"
  />

  <div
    v-else
    v-bind="attrs"
    :class="[mediaTheme.video?.wrapper, mediaTheme.base, aspectClass]"
  >
    <div
      v-if="isProcessing"
      class="relative flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-zinc-800"
    >
      <UIcon class="mb-2 size-16 text-white" name="i-lucide-clock" />
      <span class="text-lg font-semibold text-white">
        Video is Processing...
      </span>
    </div>

    <iframe
      v-if="shouldShowIframe"
      ref="iframeElement"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
      "
      allowfullscreen
      :class="[
        'absolute inset-0 h-full w-full bg-black',
        theme.media.rounded,
      ]"
      :data-mid="mid"
      loading="lazy"
      :src="mediaEmbed"
      :title="title"
      @load="scheduleInitializePlayers()"
    />

    <video
      v-else-if="shouldShowDirectVideo"
      ref="videoElement"
      :class="[
        'absolute inset-0 h-full w-full bg-black object-contain',
        theme.media.rounded,
      ]"
      controls
      playsinline
      preload="metadata"
    >
      <source :src="playbackSource?.src" />
    </video>

    <button
      v-if="!shouldShowIframe && !shouldShowDirectVideo && !isProcessing"
      :aria-label="title ? `Play video: ${title}` : 'Play video'"
      :class="[
        'group absolute inset-0 z-10 grid h-full w-full place-items-center overflow-hidden bg-black text-white',
        mediaPreviewClasses.overlayBase,
        mediaPreviewClasses.overlayTint40,
        theme.media.rounded,
      ]"
      type="button"
      @click="activateEmbed"
      @mouseenter="activateAnimatedPreview"
      @mouseleave="deactivateAnimatedPreview"
    >
      <div
        v-if="previewSrc"
        :class="[
          mediaPreviewClasses.zoomLayer,
          theme.media.transitions.slow,
          theme.media.effects.scale,
          'group-focus-within:scale-105',
        ]"
      >
        <MediaImage
          :alt="alt || title || 'Video thumbnail'"
          :fetchpriority="fetchpriority"
          :height="height"
          image-class="h-full w-full object-cover"
          :loading="loading"
          no-wrapper
          :original-revision="previewOriginalRevision"
          :original-src="previewOriginalSrc"
          :responsive-style="previewResponsiveStyle"
          :sizes="sizes || '100vw'"
          :src="previewSrc"
          :srcset="previewSrcset"
          :width="width"
        />
      </div>
      <UIcon
        :class="[mediaPreviewClasses.iconLayer, 'size-16']"
        name="i-lucide-play-circle"
      />
    </button>

    <LazyEditControls
      v-if="editActions?.length"
      :actions="editActions"
      @select="emit('edit-action-select', $event)"
    />
  </div>
</template>
