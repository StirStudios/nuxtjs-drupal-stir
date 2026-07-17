<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import ProviderImage from '#stir-image-provider'
import type { EditAction, EditActionKey } from '#stir/types/EditControls'
import {
  resolveImageDeliveryProfile,
  versionImageSource,
} from '#stir/utils/imageDelivery'
import { getDrupalOrigin, toDrupalUrl } from '#stir/utils/drupalUrl'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  title?: string
  alt?: string
  src?: string
  type?: string
  platform?: string

  originalRevision?: string
  originalSrc?: string
  srcset?: string
  sizes?: string
  deliverySizes?: string
  responsiveStyle?: string
  modalSrc?: string
  modalSrcset?: string
  modalSizes?: string
  modalResponsiveStyle?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'high' | 'auto' | 'low'
  deferSource?: boolean
  noWrapper?: boolean

  link?: string
  credit?: string
  hideCredit?: boolean
  timestamp?: string

  isHero?: boolean
  wrapperClass?: unknown
  imageClass?: unknown
  editActions?: EditAction[]
}>()

const emit = defineEmits<{
  (e: 'edit-action-select', key: EditActionKey): void
}>()

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()
const theme = appConfig.stirTheme
const attrs = useAttrs()
const { isFront } = usePageContext()
const normalizedLoading = computed<'lazy' | 'eager'>(() => {
  if (props.loading === 'eager') return 'eager'
  return 'lazy'
})
const isEager = computed(() => normalizedLoading.value === 'eager')
const injectedIsHero = inject<boolean>('isHero', false)
const isHero = computed(() =>
  props.isHero !== undefined ? props.isHero : injectedIsHero,
)
const isBare = computed(() => isHero.value || props.noWrapper === true)
const providerSizes = computed(() =>
  props.deliverySizes?.trim()
  || resolveImageDeliveryProfile(
    props.responsiveStyle,
    isHero.value,
    theme.media.image.profiles,
  ),
)
const drupalOrigin = computed(() => getDrupalOrigin(runtimeConfig.public))
const providerSource = computed(() => versionImageSource(
  toDrupalUrl(props.originalSrc, drupalOrigin.value),
  props.originalRevision,
))
const isNuxtImage = computed(() =>
  appConfig.stirImageDelivery === 'nuxt'
  && Boolean(providerSource.value && providerSizes.value),
)
const imageComponent = computed(() =>
  isNuxtImage.value ? ProviderImage : 'img',
)
const fallbackSizes = computed(() => props.sizes?.trim() || '100vw')
const wrappedSizes = computed(() => {
  const sizes = fallbackSizes.value.replace(/^auto(?:\s*,\s*)?/i, '')

  return sizes || '100vw'
})
const renderedSrc = computed(() =>
  isNuxtImage.value ? providerSource.value : props.src,
)
const renderedSrcset = computed(() =>
  isNuxtImage.value ? undefined : props.srcset,
)
const nativeSrcsetAttrs = computed(() =>
  isNuxtImage.value ? {} : { srcset: renderedSrcset.value },
)
const bareImageAttrs = computed(() => ({
  ...attrs,
  ...nativeSrcsetAttrs.value,
}))
const bareRenderedSizes = computed(() =>
  isNuxtImage.value ? providerSizes.value : fallbackSizes.value,
)
const wrappedRenderedSizes = computed(() =>
  isNuxtImage.value ? providerSizes.value : wrappedSizes.value,
)
const linkAriaLabel = computed(
  () => props.alt || props.title || 'Open media in new tab',
)
const rootAttrs = computed(() =>
  props.link
    ? {
        ...attrs,
        href: props.link,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': linkAriaLabel.value,
      }
    : attrs,
)
const hasImageSource = computed(() =>
  Boolean(props.src?.trim() || props.srcset?.trim()),
)
const hasInlineEditActions = computed(
  () => (props.editActions?.length ?? 0) > 0,
)
const imageRoot = ref<HTMLElement | null>(null)
const sourceDeferred = ref(props.deferSource === true)
const isSourceDeferred = computed(
  () => props.deferSource === true && sourceDeferred.value,
)
const deferredFrameStyle = computed(() => {
  if (!isSourceDeferred.value) return undefined

  const width = Number(props.width)
  const height = Number(props.height)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined
  }

  return { aspectRatio: `${width} / ${height}` }
})
const imageElement = ref<HTMLImageElement | null>(null)

function setImageElementRef(
  value: Element | ComponentPublicInstance | null,
): void {
  if (value instanceof HTMLImageElement) {
    imageElement.value = value
    return
  }

  const element = value && '$el' in value ? value.$el : null

  imageElement.value = element instanceof HTMLImageElement ? element : null
}

const { isSupported, stop } = useIntersectionObserver(
  imageRoot,
  ([entry]) => {
    if (!entry?.isIntersecting) return

    sourceDeferred.value = false
    stop()
  },
  {
    immediate: props.deferSource === true,
    rootMargin: '200px 0px',
  },
)

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
  if (props.deferSource === true && !isSupported.value) {
    sourceDeferred.value = false
  }

  nextTick(syncLoadedFromImageElement)
})
</script>

<template>
  <component
    :is="imageComponent"
    v-if="isBare"
    :ref="setImageElementRef"
    v-bind="bareImageAttrs"
    :alt="alt || ''"
    :class="
      isHero
        ? [
            theme.hero.image.base,
            isFront ? theme.hero.image.isFront : 'max-w-none',
            imageClass,
          ]
        : [theme.media.base, theme.media.rounded, 'm-auto !object-contain', imageClass]
    "
    :fetchpriority="fetchpriority || undefined"
    :format="isNuxtImage ? theme.media.image.format : undefined"
    :height="height"
    :loading="normalizedLoading"
    :quality="isNuxtImage ? theme.media.image.quality : undefined"
    :sizes="bareRenderedSizes"
    :src="renderedSrc"
    :width="width"
    @error="handleError"
    @load="handleLoad"
  />

  <component
    :is="link ? 'a' : 'div'"
    v-else
    ref="imageRoot"
    v-bind="rootAttrs"
    :aria-busy="isSourceDeferred ? 'true' : undefined"
    :class="[
      'media group @container relative block overflow-hidden',
      theme.media.rounded,
      isSourceDeferred && !deferredFrameStyle && 'min-h-64',
      wrapperClass,
    ]"
    :style="deferredFrameStyle"
  >
    <USkeleton
      v-if="isSourceDeferred || !isLoaded"
      class="absolute inset-0 z-0 h-full w-full rounded-none"
    />

    <component
      :is="imageComponent"
      v-if="!isSourceDeferred && !isEager"
      :ref="setImageElementRef"
      v-bind="nativeSrcsetAttrs"
      :alt="alt || ''"
      :class="[
        theme.media.base,
        theme.media.rounded,
        platform === 'instagram' ? 'aspect-3/4' : '',
        !isLoaded && 'opacity-0',
        imageClass,
      ]"
      :format="isNuxtImage ? theme.media.image.format : undefined"
      :height="height"
      :loading="normalizedLoading"
      :quality="isNuxtImage ? theme.media.image.quality : undefined"
      :sizes="wrappedRenderedSizes"
      :src="renderedSrc"
      :width="width"
      @error="handleError"
      @load="handleLoad"
    />

    <component
      :is="imageComponent"
      v-else-if="!isSourceDeferred"
      :ref="setImageElementRef"
      v-bind="nativeSrcsetAttrs"
      :alt="alt || ''"
      :class="[
        theme.media.base,
        theme.media.rounded,
        !isLoaded && 'opacity-0',
        imageClass,
      ]"
      fetchpriority="high"
      :format="isNuxtImage ? theme.media.image.format : undefined"
      :height="height"
      :loading="normalizedLoading"
      :quality="isNuxtImage ? theme.media.image.quality : undefined"
      :sizes="wrappedRenderedSizes"
      :src="renderedSrc"
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

    <LazyEditControls
      v-if="hasInlineEditActions"
      :actions="editActions ?? []"
      :render-as-buttons="Boolean(props.link)"
      @select="emit('edit-action-select', $event)"
    />
  </component>
</template>
