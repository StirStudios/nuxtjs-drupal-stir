<script setup lang="ts">
import { mediaPreviewClasses } from '~/utils/mediaPreviewClasses'
import { useVideoPlayers } from '~/composables/useVideoPlayers'

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

    width?: number
    height?: number

    noWrapper?: boolean
    deferEmbed?: boolean
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
    width: undefined,
    height: undefined,
    noWrapper: false,
    deferEmbed: true,
  },
)

const theme = useAppConfig().stirTheme
const { media: mediaTheme } = theme
const { initializePlayers } = useVideoPlayers()
const isHero = inject<boolean>('isHero', false)
const isBare = computed(() => isHero || props.noWrapper === true)
const isProcessing = computed(() => props.width === 180)
const isEmbedActive = ref(false)
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
  () =>
    !!props.mediaEmbed &&
    !isProcessing.value &&
    (!props.deferEmbed || isEmbedActive.value),
)
const previewSrc = computed(() => {
  if (props.previewMode === 'animated' && props.animatedPreviewSrc) {
    return props.animatedPreviewSrc
  }

  return props.src
})

function activateEmbed() {
  if (shouldShowIframe.value) return
  isEmbedActive.value = true
  initializePlayers()
}

onMounted(() => {
  if (!isBare.value && shouldShowIframe.value) {
    initializePlayers()
  }
})
</script>

<template>
  <video
    v-if="isBare && mediaEmbed"
    aria-hidden="true"
    class="absolute inset-0 h-full w-full object-cover"
    disablepictureinpicture
    loop
    muted
    playsinline
    :poster="src"
    preload="metadata"
  >
    <source :src="mediaEmbed" type="video/mp4" />
  </video>

  <div
    v-else-if="mediaEmbed"
    :class="['m-auto max-w-6xl', mediaTheme.base, aspectClass]"
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
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      :class="['absolute inset-0 h-full w-full bg-black', theme.media.rounded]"
      :data-mid="mid"
      loading="lazy"
      :src="mediaEmbed"
      :title="title"
    />

    <button
      v-else-if="!isProcessing"
      :aria-label="title ? `Play video: ${title}` : 'Play video'"
      :class="[
        'group absolute inset-0 z-10 grid h-full w-full place-items-center overflow-hidden bg-black text-white',
        mediaPreviewClasses.overlayBase,
        mediaPreviewClasses.overlayTint40,
        theme.media.rounded,
      ]"
      type="button"
      @click="activateEmbed"
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
          :src="previewSrc"
        />
      </div>
      <UIcon
        :class="[mediaPreviewClasses.iconLayer, 'size-16']"
        name="i-lucide-play-circle"
      />
    </button>
  </div>
</template>
