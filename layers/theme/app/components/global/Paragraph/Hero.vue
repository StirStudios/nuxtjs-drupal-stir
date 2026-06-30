<script setup lang="ts">
import { Motion } from 'motion-v'
import { cloneVNode } from 'vue'
import { usePageContext } from '~/composables/usePageContext'
import { useIntersectionObserver } from '~/composables/useIntersectionObserver'
import { useNavLockedSnapshot } from '~/composables/useNavLockedSnapshot'
import { useRevealMotionConfig } from '~/composables/useRevealMotionConfig'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'

const props = defineProps<{
  mode?: 'full' | 'simple'
  text?: string
  editLink?: string
  direction?: string
  siteSlogan?: string
  header?: string
  classes?: string
}>()

defineSlots<{
  header?(): unknown
  media?(): unknown
  footer?(): unknown
  button?(): unknown
  title?(): unknown
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const { observeVideos } = useIntersectionObserver()
const { getPage } = useDrupalCe()
const page = getPage()
const { isFront } = usePageContext()
const { hero: heroTheme } = useAppConfig().stirTheme
const pageProps = computed(() => page.value?.content?.props || {})
const pageTitle = computed(() => pageProps.value?.title || '')
const pageHide = computed(() => pageProps.value?.hide || false)

// Only needed in FULL mode
if (props.mode !== 'simple') {
  onMounted(() => observeVideos(0.1))
  provide('isHero', true)
}

const heroSnapshot = useNavLockedSnapshot(computed(() => ({
  hide: pageHide.value,
  isFront: isFront.value,
  title: pageTitle.value,
})))
const isFrontEffective = computed(() => heroSnapshot.value.isFront)
const pageTitleEffective = computed(() => heroSnapshot.value.title)
const pageHideEffective = computed(() => heroSnapshot.value.hide)

const hideHeroSection = computed(
  () => props.mode !== 'simple' && pageHideEffective.value && !isFrontEffective.value,
)

const slotMedia = computed(() => tk.slot('media'))
const heroMediaNode = computed(() => {
  const node = slotMedia.value[0]

  if (!node) return null
  return cloneVNode(node, { isHero: true }, true)
})
const hasMediaSlot = computed(() => Boolean(heroMediaNode.value))
const hasHero = computed(() => !!props.text || hasMediaSlot.value)
const containsVideo = computed(() =>
  slotMedia.value
    .some((node) =>
      normalizeDrupalMediaType(node?.props?.type) === 'video' ||
      node?.props?.mediaEmbed,
    ),
)

const h1Classes = computed(() => {
  const base = hasMediaSlot.value
    ? isFrontEffective.value
      ? heroTheme.text?.isFront
      : heroTheme.text?.heading
    : null

  return [base].filter(Boolean)
})

const heroSubtitle = computed(() => props.header || props.siteSlogan || '')

const sectionClasses = computed(() => {
  if (props.mode === 'simple') {
    return props.classes || ''
  }

  const hasHeroContent = hasHero.value

  return [
    heroTheme.base,

    hideHeroSection.value
      ? `${heroTheme.hide} sr-hide`
      : hasMediaSlot.value
        ? heroTheme.mediaSpacing
        : hasHeroContent
          ? [heroTheme.mediaSpacing, heroTheme.noMediaFallback]
          : heroTheme.noMediaSpacing,

    hasMediaSlot.value && heroTheme.overlay,
    isFrontEffective.value && heroTheme.isFront,

    containsVideo.value && 'min-h-[75vh]',
  ]
    .flat()
    .filter(Boolean)
})
const { revealMotionKey, useRevealMotionProps } = useRevealMotionConfig()
const heroMotionProps = useRevealMotionProps(() => props.direction)
</script>

<template>
  <EditLink
    v-slot="{ actions, hasActions, selectAction }"
    controls-placement="slot"
    :link="editLink"
  >
    <template v-if="mode === 'simple'">
      <slot name="header" />
      <slot name="media" />
      <slot name="footer" />

      <LazyEditControls
        v-if="hasActions"
        :actions="actions"
        @select="selectAction"
      />
    </template>

    <template v-else>
      <section class="relative" :class="sectionClasses">
        <Motion
          :key="`hero-${revealMotionKey}`"
          as-child
          v-bind="heroMotionProps"
        >
          <div
            :class="[
              heroTheme.text.base,
              isFrontEffective && heroTheme.text.isFront,
            ]"
          >
            <slot name="title">
              <HeroContent
                v-if="text"
                :hero-text="text"
                :is-front="isFrontEffective"
                :page-title="pageTitleEffective"
                :subtitle="heroSubtitle"
              />

              <h1 v-else v-bind="h1Classes.length ? { class: h1Classes } : {}">
                {{ pageTitleEffective }}
              </h1>
            </slot>

            <slot name="button" />
          </div>
        </Motion>

        <component :is="heroMediaNode" />

        <LazyEditControls
          v-if="hasActions"
          :actions="actions"
          @select="selectAction"
        />
      </section>
    </template>
  </EditLink>
</template>
