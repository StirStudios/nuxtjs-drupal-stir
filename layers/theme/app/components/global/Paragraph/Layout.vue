<script setup lang="ts">
import { slugify } from '#stir/utils/stringUtils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  layout?: string
  container?: boolean
  card?: boolean

  label?: string
  header?: string
  headerTag?: string

  width?: string
  spacing?: string
  gridClass?: string
  classes?: string
  regionAlign?: Record<string, string>

  randomize?: boolean
  editLink?: string
}>()

const vueSlots = useSlots()
const orderedSlots = computed(() => Object.entries(vueSlots))
const isGridLayout = computed(
  () => props.layout === 'grid' || props.layout?.startsWith('grid_col') === true,
)
const hasGridItems = computed(() => isGridLayout.value && Boolean(vueSlots.items))
const sectionId = computed(() => {
  if (props.label) return slugify(props.label)
  return `section-${props.id ?? 'unknown'}`
})
</script>

<template>
  <section :id="sectionId" :class="[classes || 'content', spacing]">
    <WrapGrid
      :card="card"
      :container="container"
      :grid-items="gridClass"
      :width="width"
    >
      <component :is="headerTag || 'h2'" v-if="header" class="col-span-full">
        {{ props.header }}
      </component>

      <slot v-if="hasGridItems" name="items" />

      <template v-for="[slotName] in orderedSlots" :key="slotName">
        <div
          v-if="!hasGridItems || slotName !== 'items'"
          :class="[
            'region',
            slotName,
            props.regionAlign?.[slotName],
            ['top', 'bottom'].includes(slotName) ? 'col-span-full' : '',
          ]"
        >
          <slot :name="slotName" />
        </div>
      </template>
    </WrapGrid>
  </section>
</template>
