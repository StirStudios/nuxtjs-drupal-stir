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
</script>

<template>
  <img
    v-if="isBare"
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
    <img
      v-if="!isEager"
      :alt="alt || ''"
      :class="[
        theme.media.base,
        platform === 'instagram' ? 'aspect-3/4' : '',
      ]"
      :height="height"
      :loading="normalizedLoading"
      :sizes="sizes || '100vw'"
      :src="src"
      :srcset="srcset"
      :width="width"
    />

    <img
      v-else
      :alt="alt || ''"
      :class="[theme.media.base]"
      fetchpriority="high"
      :height="height"
      :loading="normalizedLoading"
      :sizes="sizes || '100vw'"
      :src="src"
      :srcset="srcset"
      :width="width"
    />

    <ClientOnly>
      <div
        v-if="platform === 'instagram'"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 px-4 text-center text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
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
        class="absolute bottom-0 left-0 w-full translate-x-0 bg-black/40 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 @xs:left-1/2 @xs:w-auto @xs:-translate-x-1/2"
      >
        {{ credit }}
      </span>
    </ClientOnly>
  </component>
</template>
