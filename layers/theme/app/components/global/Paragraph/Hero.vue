<script setup lang="ts">
import { cloneVNode } from 'vue'
import { tv } from '@nuxt/ui/utils/tv'
import { slugify } from '#stir/utils/stringUtils'
import { drupalPageKey } from '#stir/utils/drupalPage'
import { usePageContext } from '#stir/composables/usePageContext'
import { useNavLockedSnapshot } from '#stir/composables/useNavLockedSnapshot'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '#stir/composables/useRevealMotionScope'
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'

const props = defineProps<{
  mode?: 'full' | 'simple'
  id?: string | number
  label?: string
  placement?: string
  align?: string
  mediaHeight?: string
  eyebrow?: string
  headerTag?: string
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

const isSection = computed(() => Boolean(props.placement && props.placement !== 'field_hero'))
const sectionHeadingTag = computed(() => ['h2', 'h3', 'h4', 'h5', 'h6'].includes(props.headerTag || '') ? props.headerTag : 'h2')
const minimumHeight = computed(() => ({ small: 'clamp(12rem,22vw,18rem)', break: 'clamp(18rem,34vw,30rem)', feature: 'clamp(24rem,48vw,42rem)' })[props.mediaHeight as 'small' | 'break' | 'feature'])
const customContent = computed(() => isSection.value || Boolean(props.align) || Boolean(minimumHeight.value))
const alignment = computed(() => {
  const tokens = props.align?.split(/\s+/) || []

  return {
    vertical: tokens.includes('items-end') ? 'items-end' : tokens.includes('items-start') ? 'items-start' : 'items-center',
    horizontal: tokens.includes('justify-start') ? 'items-start' : tokens.includes('justify-end') ? 'items-end' : 'items-center',
    text: tokens.includes('text-start') || tokens.includes('text-left') ? 'text-start' : tokens.includes('text-end') || tokens.includes('text-right') ? 'text-end' : tokens.includes('justify-start') ? 'text-start' : tokens.includes('justify-end') ? 'text-end' : 'text-center',
    actions: tokens.includes('justify-start') ? 'justify-start' : tokens.includes('justify-end') ? 'justify-end' : 'justify-center',
  }
})
const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const { getPage } = useStirDrupalCe()
const owningPage = inject(drupalPageKey, null)
const page = owningPage ?? getPage()
const { isFront, isAdministrator } = usePageContext(page)
const { hero: heroTheme } = useAppConfig().stirTheme
const pageProps = computed(() => page.value?.content?.props || {})
const pageTitle = computed(() => {
  const title = pageProps.value?.title

  return typeof title === 'string' && title.trim() ? title.trim() : page.value?.title?.trim() || ''
})
const pageHideTitle = computed(() => pageProps.value?.hideTitle ?? false)

if (props.mode !== 'simple') {
  provide('isHero', true)
}

const heroState = computed(() => ({
  hideTitle: pageHideTitle.value,
  isFront: owningPage ? owningPage.value?.is_front_page === true : isFront.value,
  title: pageTitle.value,
}))
const heroSnapshot = owningPage ? heroState : useNavLockedSnapshot(heroState)
const isFrontEffective = computed(() => !isSection.value && heroSnapshot.value.isFront)
const pageTitleEffective = computed(() => isSection.value ? '' : heroSnapshot.value.title)
const pageHideTitleEffective = computed(() => resolveBooleanProp(heroSnapshot.value.hideTitle))

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

const heroSubtitle = computed(() => props.header?.trim() || '')
const hasVisibleDefaultContent = computed(() =>
  Boolean(isSection.value && (props.header?.trim() || props.eyebrow?.trim() || (isAdministrator.value && props.id))) ||
  Boolean(props.header?.trim()) ||
  Boolean(props.eyebrow?.trim()) ||
  Boolean(props.text?.trim()) ||
  Boolean(pageTitleEffective.value && !pageHideTitleEffective.value) ||
  Boolean(
    pageTitleEffective.value &&
    isFrontEffective.value &&
    heroSubtitle.value,
  ),
)
const hasVisibleHeroContent = computed(() =>
  tk.slot('title').length > 0 ||
  tk.slot('button').length > 0 ||
  hasVisibleDefaultContent.value,
)

const sectionClasses = computed(() => {
  if (props.mode === 'simple') {
    return props.classes || ''
  }

  if (isSection.value) return ['hero hero-section relative overflow-hidden [&>:is(.media,img)]:absolute [&>:is(.media,img)]:inset-0 [&>:is(.media,img)]:h-full [&>:is(.media,img)]:w-full [&>.media_img]:h-full [&>.media_img]:w-full [&>.media_img]:object-cover', heroTheme.mediaAppearance, hasMediaSlot.value && heroTheme.overlay]

  const hasHeroContent = hasHero.value

  return [
    heroTheme.base,
    hasMediaSlot.value && heroTheme.mediaAppearance,

    pageHideTitleEffective.value && !hasHeroContent && !isFrontEffective.value
      ? heroTheme.hide
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
const { getRevealDelayMs, useRevealMotionProps } =
  useRevealMotionConfig()
const { effect, isInherited, staggerIndex } =
  useRevealMotionScope(() => props.direction)
const heroMotionProps = useRevealMotionProps(
  () => isInherited.value ? undefined : effect.value,
  () => getRevealDelayMs(staggerIndex.value),
  {
    // Explicit hero motion is an SSR-rendered entrance animation, not a
    // viewport reveal. Inherited page motion continues to skip the hero.
    ssrVisible: false,
    trigger: 'enter',
  },
)

// Keep inherited scroll reveals off hero content.
provideRevealMotionScope(() => undefined)
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
      <section :id="isSection ? (label ? slugify(label) : id ? `hero-${id}` : undefined) : undefined" class="relative" :class="tv({ base: [sectionClasses, customContent && 'flex flex-row', customContent && alignment.vertical] })()" :style="minimumHeight ? { minHeight: minimumHeight, height: 'auto' } : undefined">
        <RevealMotion
          v-if="hasVisibleHeroContent || pageTitleEffective"
          as-child
          v-bind="heroMotionProps"
        >
          <div
            :class="tv({ base: [
              hasVisibleHeroContent && !isSection && heroTheme.text.base,
              isSection && 'relative z-10 w-full p-8 lg:p-24',
              hasVisibleHeroContent && isFrontEffective && heroTheme.text.isFront,
              customContent && ['hero-content-aligned relative inset-auto w-full [&>*]:w-full [&_:is(h1,h2,h3,h4,h5,h6,.lead)]:[text-align:inherit]', alignment.horizontal, alignment.text],
              'hero-content-flow flex flex-col gap-[var(--stir-content-action-gap,1.5rem)] motion-reduce:!opacity-100 motion-reduce:!transform-none',
            ] })()"
          >
            <slot name="title">
              <template v-if="isSection">
                <div v-if="header?.trim() || eyebrow?.trim() || (isAdministrator && id)" class="heading-group">
                  <p v-if="eyebrow?.trim()" class="eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase">{{ eyebrow }}</p>
                <EditableRichText
                  v-if="header?.trim() || (isAdministrator && id)"
                  :id="id"
                  :edit-link="editLink"
                  :edit-target="{ entityType: 'paragraph', entityId: id, fieldName: 'field_header', editorMode: 'heading' }"
                  :text="header"
                  :text-source="headerTag ? `${headerTag}|${header || ''}` : header"
                >
                  <component :is="sectionHeadingTag" v-if="header?.trim()" class="heading">{{ header }}</component>
                </EditableRichText>
                </div>
                <EditableRichText v-if="text?.trim() || (isAdministrator && id)" :id="id" classes="lead" :edit-link="editLink" :text="text" />
              </template>
              <HeroContent
                v-else
                :id="id"
                :edit-link="editLink"
                :eyebrow="eyebrow"
                :header-tag="headerTag"
                :hero-text="text"
                :hide-title="pageHideTitleEffective"
                :is-front="isFrontEffective"
                :page-title="pageTitleEffective"
                :subtitle="heroSubtitle"
              />

            </slot>

            <div v-if="tk.slot('button').length" class="hero-actions" :class="tv({ base: [heroTheme.actions, customContent && alignment.actions] })()">
              <slot name="button" />
            </div>
          </div>
        </RevealMotion>

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
