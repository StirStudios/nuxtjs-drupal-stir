<script setup lang="ts">
import { mediaPreviewClasses } from '~/utils/mediaPreviewClasses'
import { useDeferredVideoSource } from '~/composables/useDeferredVideoSource'
import { useVideoPlayers } from '~/composables/useVideoPlayers'
import type { EditAction, EditActionKey } from '~/types/EditControls'

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
  source: () => props.mediaEmbed,
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
  () => !!props.mediaEmbed && !isProcessing.value && isEmbedActive.value,
)
const previewSrc = computed(() => {
  if (
    isAnimatedPreviewActive.value
    && props.previewMode === 'animated'
    && props.animatedPreviewSrc
  ) {
    return props.animatedPreviewSrc
  }

  return props.src
})
const previewSrcset = computed(() =>
  isAnimatedPreviewActive.value ? undefined : props.srcset,
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
  if (shouldShowIframe.value) return
  isEmbedActive.value = true
  void scheduleInitializePlayers()
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
  <img
    v-if="isBare && src"
    v-bind="attrs"
    :alt="alt || ''"
    aria-hidden="true"
    class="absolute inset-0 h-full w-full object-cover"
    :fetchpriority="fetchpriority"
    :height="height"
    :loading="loading"
    :sizes="sizes || '100vw'"
    :src="src"
    :srcset="srcset"
    :width="width"
  />

  <video
    v-if="isBare"
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
      :src="mediaEmbed"
      type="video/mp4"
    />
  </video>

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

    <button
      v-if="!shouldShowIframe && !isProcessing"
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
        <img
          :alt="alt || title || 'Video thumbnail'"
          class="h-full w-full object-cover"
          :fetchpriority="fetchpriority"
          :height="height"
          :loading="loading"
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
