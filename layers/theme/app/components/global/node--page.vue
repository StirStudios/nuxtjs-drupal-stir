<script setup lang="ts">
import type { NodeDefaultProps } from '#stir/types'
import { resolveRouteHeroElements } from '#stir/utils/routeHero'

const props = defineProps<NodeDefaultProps>()
const attrs = useAttrs()
const slots = useSlots()
const nodeProps = computed(() => ({
  ...props,
  ...attrs,
}))
const { node, routeHero } = useAppConfig().stirTheme
// The layout route hero renders the page hero; skipping the slot avoids a second H1.
const skipHeroSlot = routeHero.enabled && resolveRouteHeroElements(routeHero.elements).includes('node-page')
const forwardedSlotNames = computed(() =>
  Object.keys(slots).filter(name => !(skipHeroSlot && name === 'hero')),
)

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <NodeDefault :content-class="node?.pageContentClass" v-bind="nodeProps">
    <template
      v-for="slotName in forwardedSlotNames"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </NodeDefault>
</template>
