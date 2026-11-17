<script setup lang="ts">
import type { ImageModifiers } from '@nuxt/image'
import { useIntersectionObserver } from '@vueuse/core'
import type { FunctionalComponent } from 'vue'
import type { EditAction, EditActionKey } from '#stir/types/EditControls'
import type { CoverCropSource } from '#stir/utils/imageDelivery'
import {
  containerSlot,
  coverCropSources,
  coverSlot,
  HERO_HIGH_DENSITY_SCALE,
  imageSlotKey,
  imageSlotSizes,
  ladderSrcset,
  leadImageKey,
  mediaAspectRatio,
  sectionHeroMediaKey,
  versionImageSource,
  viewportImageLoadingKey,
  viewportSlot,
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
  deliverySizes?: string
  // A Media paragraph height key (media.heights) when the box crops the image.
  mediaHeight?: string
  // The shape of a box of fixed aspect ratio that object-cover crops the image
  // to, as width / height ('261/167' or 1.56), so a wider image is sized at
  // the width it is drawn rather than the box width.
  coverAspect?: number | string
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
  roundedClass?: string
  editActions?: EditAction[]
}>()

const emit = defineEmits<{
  (e: 'edit-action-select', key: EditActionKey): void
  (e: 'resolved-src', source: string | undefined): void
}>()

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()
const theme = appConfig.stirTheme
const resolvedRoundedClass = computed(() =>
  props.roundedClass || theme.media.rounded,
)
const attrs = useAttrs()
const forwardedAttrs = computed(() => {
  // deliveryProfile: sent by Drupal before Stir Tools contract 1.41.0; unused.
  const {
    deliveryProfile: _deliveryProfile,
    modalResponsiveStyle: _modalResponsiveStyle,
    modalSizes: _modalSizes,
    modalSrc: _modalSrc,
    modalSrcset: _modalSrcset,
    responsiveStyle: _responsiveStyle,
    sizes: _sizes,
    srcset: _srcset,
    ...safeAttrs
  } = attrs

  return safeAttrs
})
const { isFront } = usePageContext()
const viewportLoading = inject(viewportImageLoadingKey, false)
const isLeadImage = inject(leadImageKey, undefined)?.() === true
const normalizedLoading = computed<'lazy' | 'eager'>(() => {
  if (isLeadImage || (!viewportLoading && props.loading === 'eager')) return 'eager'
  return 'lazy'
})
const normalizedFetchPriority = computed(() => {
  if (isLeadImage) return 'high'
  return viewportLoading ? 'auto' : props.fetchpriority || undefined
})
const isEager = computed(() => normalizedLoading.value === 'eager')
const injectedIsHero = inject<boolean>('isHero', false)
const injectedSlot = inject(imageSlotKey, undefined)
const isHero = computed(() =>
  props.isHero !== undefined ? props.isHero : injectedIsHero,
)
const isBare = computed(() => isHero.value || props.noWrapper === true)
const sectionHero = inject(sectionHeroMediaKey, undefined)
const isSectionHero = computed(() => isHero.value && Boolean(sectionHero?.value))
const $img = useImage()
// The width the image is shown at: a hero or an edge-to-edge image spans the
// viewport; anything else takes the slot its layout provides, or the theme
// container. A cover-cropped image in a fixed-height box (a Media height
// other than natural, or a hero) is shown wider than the box when it is wider
// than the box's ratio.
const coverHeight = computed(() => isHero.value
  ? theme.media.image.coverHeights?.hero
  : isBare.value ? undefined : theme.media.image.coverHeights?.[props.mediaHeight ?? ''])
const boxSlot = computed(() => isHero.value
  ? viewportSlot
  : injectedSlot?.value ?? containerSlot(viewportSlot, theme.media.image.container))
// How much wider than a fixed-aspect box (coverAspect) the image is drawn.
const coverAspectOverflow = computed(() => {
  const [width = Number.NaN, height = 1] = String(props.coverAspect ?? '').split('/').map(Number)
  const box = width / height
  const known = Number(props.width) > 0 && Number(props.height) > 0

  return box > 0 && known ? Math.max(1, mediaAspectRatio(props.width, props.height) / box) : 1
})
const imageSlot = computed(() => {
  const slot = coverHeight.value
    ? coverSlot(boxSlot.value, coverHeight.value, props.width, props.height)
    : boxSlot.value
  const overflow = coverAspectOverflow.value

  return overflow > 1 ? (viewport: number) => slot(viewport) * overflow : slot
})
// An explicit delivery size (@nuxt/image `sizes` syntax) wins over the slot.
const providerSizes = computed(() => {
  const explicit = props.deliverySizes?.trim()

  return explicit
    ? $img.getSizes(providerSource.value || '/', { sizes: explicit }).sizes
    // `sizes="auto"` uses the box width, which a cover-cropped image overflows.
    : imageSlotSizes(imageSlot.value, normalizedLoading.value === 'lazy' && !coverHeight.value && coverAspectOverflow.value === 1, {
        highDensityScale: isHero.value ? HERO_HIGH_DENSITY_SCALE : undefined,
      })
})
const drupalOrigin = computed(() => getDrupalOrigin(runtimeConfig.public))
const providerSource = computed(() => versionImageSource(
  toDrupalUrl(props.originalSrc || props.src, drupalOrigin.value),
  props.originalRevision,
))
// Sites don't depend on @nuxt/image directly, so its generated provider types
// resolve to nothing there and $img's modifiers parameter becomes `undefined`.
// Type the modifiers against @nuxt/image itself.
const imageUrl = (source: string, width?: number, height?: number, fit?: 'cover') => $img(source, {
  fit,
  format: theme.media.image.format,
  height,
  quality: theme.media.image.quality,
  width,
} satisfies Partial<ImageModifiers> as never)
const providerSrcset = computed(() => {
  const source = providerSource.value

  return source ? ladderSrcset((width, height) => imageUrl(source, width, height), props.width, props.height) : undefined
})
// A Media box of fixed height crops the image to its shape per breakpoint
// band, so a phone loads the slice it shows. Heroes are left whole: their
// object position varies by theme.
const coverSources = computed(() => {
  const source = providerSource.value

  if (!source || !coverHeight.value || isHero.value || props.deliverySizes?.trim()) return []

  return coverCropSources(boxSlot.value, coverHeight.value, props.width, props.height, (width, height) =>
    imageUrl(source, width, height, 'cover'))
})
// Wraps the image in <picture> only when it has cropped sources.
const CoverPicture: FunctionalComponent<{ sources: CoverCropSource[] }> = (pictureProps, { slots }) =>
  pictureProps.sources.length
    ? h('picture', { class: 'contents' }, [
        ...pictureProps.sources.map(source => h('source', { key: source.media, ...source })),
        slots.default?.(),
      ])
    : slots.default?.()
// The fallback for browsers without srcset: the source, at most 1920px wide.
const providerSrc = computed(() => {
  const source = providerSource.value

  if (!source) return undefined

  const width = Math.min(Number(props.width) || 1920, 1920)
  const height = Number(props.width) > 0 && Number(props.height) > 0
    ? Math.round((width * Number(props.height)) / Number(props.width))
    : undefined

  return imageUrl(source, width, height)
})
const bareImageAttrs = computed(() => ({
  ...forwardedAttrs.value,
}))
const linkAriaLabel = computed(
  () => props.alt || props.title || 'Open media in new tab',
)
const rootAttrs = computed(() =>
  props.link && !hasInlineEditActions.value
    ? {
        ...forwardedAttrs.value,
        href: props.link,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': linkAriaLabel.value,
      }
    : forwardedAttrs.value,
)
const hasImageSource = computed(() =>
  Boolean(providerSource.value),
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

const nuxtApp = useNuxtApp()
// An image starts visible when it has no source, when this browser already
// loaded it, or when it was server-rendered: the browser paints it as it
// arrives, without waiting for JavaScript, and it can count as the page's
// largest paint. Images added after hydration fade in.
const startsVisible = () =>
  !hasImageSource.value ||
  isImageSourceLoaded(providerSource.value) ||
  import.meta.server ||
  nuxtApp.isHydrating
const isLoaded = ref(startsVisible())

function syncLoadedFromImageElement() {
  if (!hasImageSource.value) {
    isLoaded.value = true
    return
  }

  const img = imageElement.value

  if (!img) return
  if (img.complete) {
    isLoaded.value = true
    if (img.naturalWidth) markImageSourceLoaded(providerSource.value)
    emit('resolved-src', img.naturalWidth ? img.currentSrc || img.src : undefined)
  }
}

watch(
  () => [providerSource.value, providerSizes.value, props.width, props.height],
  () => {
    isLoaded.value = startsVisible()
    emit('resolved-src', undefined)
    nextTick(syncLoadedFromImageElement)
  },
  { immediate: true },
)

function handleLoad() {
  isLoaded.value = true
  markImageSourceLoaded(providerSource.value)
  syncLoadedFromImageElement()
}

function handleError() {
  isLoaded.value = true
  emit('resolved-src', undefined)
}

onMounted(() => {
  if (props.deferSource === true && !isSupported.value) {
    sourceDeferred.value = false
  }

  nextTick(syncLoadedFromImageElement)
})
</script>

<template>
  <img
    v-if="isBare"
    ref="imageElement"
    v-bind="bareImageAttrs"
    :alt="alt || ''"
    :class="
      isHero
        ? [
          isSectionHero
            ? theme.hero.image.section
            : [theme.hero.image.base, isFront ? theme.hero.image.isFront : 'max-w-none'],
          !isLoaded && 'bg-elevated text-transparent motion-safe:animate-pulse',
          imageClass,
        ]
        : [
          theme.media.base,
          resolvedRoundedClass,
          'm-auto object-contain!',
          !isLoaded && 'bg-elevated text-transparent motion-safe:animate-pulse',
          imageClass,
        ]
    "
    :fetchpriority="normalizedFetchPriority"
    :height="height"
    :loading="normalizedLoading"
    :sizes="providerSizes"
    :src="providerSrc"
    :srcset="providerSrcset"
    :width="width"
    @error="handleError"
    @load="handleLoad"
  />

  <component
    :is="link && !hasInlineEditActions ? 'a' : 'div'"
    v-else
    ref="imageRoot"
    v-bind="rootAttrs"
    :aria-busy="isSourceDeferred ? 'true' : undefined"
    :class="[
      'media group @container relative block overflow-hidden',
      resolvedRoundedClass,
      isSourceDeferred && !deferredFrameStyle && 'min-h-64',
      wrapperClass,
    ]"
    :style="deferredFrameStyle"
  >
    <USkeleton
      v-if="isSourceDeferred || !isLoaded"
      aria-hidden="true"
      aria-live="off"
      class="absolute inset-0 z-0 h-full w-full rounded-none"
      role="presentation"
    />

    <CoverPicture v-if="!isSourceDeferred" :sources="coverSources">
      <img
        ref="imageElement"
        :alt="alt || ''"
        :class="[
          theme.media.base,
          resolvedRoundedClass,
          !isEager && platform === 'instagram' ? 'aspect-3/4' : '',
          !isLoaded && 'opacity-0',
          imageClass,
        ]"
        :fetchpriority="normalizedFetchPriority"
        :height="height"
        :loading="normalizedLoading"
        :sizes="providerSizes"
        :src="providerSrc"
        :srcset="providerSrcset"
        :width="width"
        @error="handleError"
        @load="handleLoad"
      />
    </CoverPicture>

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
          as="span"
          class="mt-5"
          size="sm"
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

    <slot name="overlay" />

    <a
      v-if="link && hasInlineEditActions"
      :aria-label="linkAriaLabel"
      class="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      :href="link"
      rel="noopener noreferrer"
      target="_blank"
    />
    <LazyEditControls
      v-if="hasInlineEditActions"
      :actions="editActions ?? []"
      @select="emit('edit-action-select', $event)"
    />
  </component>
</template>
