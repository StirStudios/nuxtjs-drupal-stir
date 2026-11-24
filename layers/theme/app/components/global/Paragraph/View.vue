<script setup lang="ts">
import { drupalViewQueryIdentityKey, drupalViewQueryNamespaceKey } from '#stir/utils/drupalViewContext'
import { resolveLegacyDrupalViewQueryNamespace } from '#stir/utils/drupalViewQueryNamespace'
import type { GridConfig } from '#stir/utils/gridClasses'
import { provideRevealMotionScope } from '#stir/composables/useRevealMotionScope'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  header?: string
  gridItems?: GridConfig
  width?: string
  spacingTop?: string
  spacingBottom?: string
  editLink?: string
  direction?: string

  viewId?: string
  displayId?: string
  paragraphId?: number | string
  paragraphUuid?: string
  queryNamespace?: string
  view?: unknown

  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
}>()

provide(drupalViewQueryIdentityKey, computed(() => props))

// The paragraph's Animation (direction) belongs to its rows, which reveal
// through DrupalViewDisplay; without one they keep the page's animation.
if (props.direction) provideRevealMotionScope(() => props.direction)

provide(
  drupalViewQueryNamespaceKey,
  computed(() => {
    const hasInstanceIdentity = Boolean(
      props.queryNamespace
      || props.paragraphUuid
      || props.uuid
      || props.paragraphId
      || props.id,
    )

    return hasInstanceIdentity
      ? resolveLegacyDrupalViewQueryNamespace(props)
      : undefined
  }),
)
</script>

<template>
  <slot name="content" />
</template>
