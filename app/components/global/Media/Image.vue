<script setup lang="ts">
import { usePageContext } from '~/composables/usePageContext'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  title?: string
  alt?: string
  src?: string
  type?: string
  platform?: string

  srcset?: string
  sizes?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'high' | 'auto'
  noWrapper?: boolean

  link?: string
  credit?: string
  hideCredit?: boolean

  isHero?: boolean
}>()

const theme = useAppConfig().stirTheme
const { isFront } = usePageContext()
const normalizedLoading = computed<'lazy' | 'eager'>(() => {
  if (props.loading === 'eager') return 'eager'
  return 'lazy'
})
const isEager = computed(() => normalizedLoading.value === 'eager')
const injectedIsHero = inject<boolean>('isHero', false)
const isHero = computed(() => props.isHero === true || injectedIsHero)
const isBare = computed(() => isHero.value || props.noWrapper === true)
const linkAriaLabel = computed(
  () => props.alt || props.title || 'Open media in new tab',
)
const hasImageSource = computed(() =>
  Boolean(props.src?.trim() || props.srcset?.trim()),
)
const imageElement = ref<HTMLImageElement | null>(null)

const isLoaded = ref(!hasImageSource.value)

function syncLoadedFromImageElement() {
  if (!hasImageSource.value) {
    isLoaded.value = true
    return
  }

  const img = imageElement.value

  if (!img) return
  if (img.complete) {
    isLoaded.value = true
  }
}

watch(
  () => [props.src, props.srcset, props.sizes, props.width, props.height],
  () => {
    isLoaded.value = !hasImageSource.value
    nextTick(syncLoadedFromImageElement)
  },
  { immediate: true },
)

function handleLoad() {
  isLoaded.value = true
}

function handleError() {
  isLoaded.value = true
}

onMounted(() => {
  nextTick(syncLoadedFromImageElement)
})
</script>

<template>
  <img
    v-if="isBare"
    ref="imageElement"
    :alt="alt || ''"
    :class="
      isHero
        ? [
            theme.hero.image.base,
            isFront.value ? theme.hero.image.isFront : 'max-w-none',
          ]
        : [theme.media.base, theme.media.rounded, 'm-auto !object-contain']
    "
    :fetchpriority="fetchpriority || undefined"
    :height="height"
    :loading="normalizedLoading"
    :sizes="sizes || '100vw'"
    :src="src"
    :srcset="srcset"
    :width="width"
    @error="handleError"
    @load="handleLoad"
  />

  <component
    :is="link ? 'a' : 'div'"
    v-else
    v-bind="
      link
        ? {
            href: link,
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-label': linkAriaLabel,
          }
        : {}
    "
    :class="[
      'media group @container relative block overflow-hidden',
      theme.media.rounded,
    ]"
  >
    <USkeleton
      v-if="!isLoaded"
      class="absolute inset-0 z-0 h-full w-full rounded-none"
    />

    <img
      v-if="!isEager"
      ref="imageElement"
      :alt="alt || ''"
      :class="[
        theme.media.base,
        platform === 'instagram' ? 'aspect-3/4' : '',
        !isLoaded && 'opacity-0',
      ]"
      :height="height"
      :loading="normalizedLoading"
      :sizes="sizes || '100vw'"
      :src="src"
      :srcset="srcset"
      :width="width"
      @error="handleError"
      @load="handleLoad"
    />

    <img
      v-else
      ref="imageElement"
      :alt="alt || ''"
      :class="[theme.media.base, !isLoaded && 'opacity-0']"
      fetchpriority="high"
      :height="height"
      :loading="normalizedLoading"
      :sizes="sizes || '100vw'"
      :src="src"
      :srcset="srcset"
      :width="width"
      @error="handleError"
      @load="handleLoad"
    />

    <ClientOnly>
      <div
        v-if="platform === 'instagram'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 px-4 text-center text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <div class="line-clamp-5 max-w-full leading-relaxed break-words">
          {{ title }}
        </div>
        <UButton
          v-if="link"
          class="mt-5"
          size="sm"
          :to="link"
          variant="outline"
        >
          View on Instagram
        </UButton>
      </div>

      <span
        v-else-if="credit && !hideCredit"
        class="absolute bottom-0 left-0 w-full translate-x-0 bg-black/40 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 @xs:left-1/2 @xs:w-auto @xs:-translate-x-1/2"
      >
        {{ credit }}
      </span>
    </ClientOnly>
  </component>
</template>
