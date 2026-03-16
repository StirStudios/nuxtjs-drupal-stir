<script setup lang="ts">
import { slugify } from '~/utils/stringUtils'

const props = defineProps<{
  id?: number | string
  uuid?: string

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
}>()

const vueSlots = useSlots()
const orderedSlots = computed(() => Object.entries(vueSlots))
const sectionId = computed(() => {
  if (props.label) return slugify(props.label)
  return `section-${props.id ?? 'unknown'}`
})
</script>

<template>
  <section :id="sectionId" :class="[classes || 'content', spacing]">
    <component :is="headerTag || 'h2'" v-if="header">
      {{ props.header }}
    </component>

    <WrapGrid
      :card="card"
      :container="container"
      :grid-items="gridClass"
      :width="width"
    >
      <template v-for="[slotName] in orderedSlots" :key="slotName">
        <div
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
