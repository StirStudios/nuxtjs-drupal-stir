<script setup lang="ts">
import { aspectRatios } from '~/utils/aspectRatios'
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
const aspectClass = computed(() => {
  const ratio = aspectRatios(props.width ?? null, props.height ?? null)

  return ratio || 'aspect-video'
})

const shouldShowIframe = computed(
  () =>
    !!props.mediaEmbed &&
    !isProcessing.value &&
    (!props.deferEmbed || isEmbedActive.value),
)

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
      v-else
      :aria-label="title ? `Play video: ${title}` : 'Play video'"
      :class="[
        'absolute inset-0 z-10 flex h-full w-full items-center justify-center overflow-hidden bg-black text-white',
        theme.media.rounded,
      ]"
      type="button"
      @click="activateEmbed"
    >
      <img
        v-if="src"
        :alt="alt || title || 'Video thumbnail'"
        class="absolute inset-0 h-full w-full object-cover"
        :src="src"
      />
      <div class="absolute inset-0 bg-black/40" />
      <UIcon class="relative z-10 size-16" name="i-lucide-play-circle" />
    </button>
  </div>
</template>
