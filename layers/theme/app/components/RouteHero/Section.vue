<script setup lang="ts">
import type { RouteHero, RouteHeroAction } from '#stir/types/RouteHero'
import { resolveUiButtonVariant, resolveUiColor } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  hero: RouteHero
}>()

defineSlots<{
  actions?(props: { actions: RouteHeroAction[] }): unknown
  default?(): unknown
  media?(): unknown
}>()

const theme = useAppConfig().stirTheme.routeHero
const variant = computed(() => props.hero.variant ?? (props.hero.image ? 'cover' : 'simple'))
const variantTheme = computed(() => theme.variants[variant.value] ?? {})
const image = computed(() =>
  variant.value === 'simple' || props.hero.mediaFirst ? undefined : props.hero.image,
)
const parallaxStyle = useParallaxStyle({
  enabled: () => Boolean(theme.parallax && image.value),
})
</script>

<template>
  <section
    :class="[theme.base, variantTheme.base]"
    :data-variant="variant"
  >
    <div :class="[theme.band, hero.surfaceClass || theme.surface, variantTheme.band]">
      <template v-if="image">
        <div :class="theme.visual" :style="parallaxStyle">
          <MediaImage
            :alt="image.alt || ''"
            fetchpriority="high"
            :height="image.height"
            :image-class="theme.image"
            is-hero
            loading="eager"
            :original-revision="image.originalRevision"
            :original-src="image.originalSrc"
            :src="image.src"
            :style="image.position ? { objectPosition: image.position } : undefined"
            :width="image.width"
          />
        </div>
        <span aria-hidden="true" :class="theme.overlay" />
      </template>
    </div>

    <div :class="[theme.container, variantTheme.container]">
      <div :class="[theme.content, variantTheme.content]">
        <slot v-if="hero.mediaFirst" name="media" />

        <p v-if="hero.eyebrow" :class="theme.eyebrow">
          {{ hero.eyebrow }}
        </p>

        <h1 :class="[theme.title, { 'sr-only': hero.hideTitle }]">
          <template v-if="hero.titleLines?.length">
            <span
              v-for="(line, index) in hero.titleLines"
              :key="index"
              class="block"
            >
              {{ line }}
            </span>
          </template>
          <template v-else>
            {{ hero.title }}
          </template>
        </h1>

        <p v-if="hero.description" :class="theme.description">
          {{ hero.description }}
        </p>

        <div v-if="hero.actions?.length || $slots.actions" :class="theme.actions">
          <slot :actions="hero.actions ?? []" name="actions">
            <UButton
              v-for="(action, index) in hero.actions"
              :key="`${index}:${action.to}`"
              :color="resolveUiColor(action.color)"
              :icon="action.icon"
              :label="action.label"
              :rel="action.external ? 'noopener noreferrer' : undefined"
              size="xl"
              :target="action.external ? '_blank' : undefined"
              :to="action.to"
              :variant="resolveUiButtonVariant(action.variant)"
            />
          </slot>
        </div>

        <slot v-if="!hero.mediaFirst" name="media" />
        <slot />
      </div>
    </div>
  </section>
</template>
