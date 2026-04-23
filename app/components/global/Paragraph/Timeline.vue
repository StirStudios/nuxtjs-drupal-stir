<script setup lang="ts">
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { cleanHTML } from '~/utils/cleanHTML'

type UITimelineItem = {
  date?: string
  title?: string
  icon?: string
  description?: string
  slot?: string
}

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  align?: string
  direction?: string
  classes?: string
  width?: string
  spacing?: string
  color?: string

  editLink?: string
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const timelineNodes = computed(() => tk.slot('timeline'))

const timelineItems = computed<UITimelineItem[]>(() =>
  timelineNodes.value.map((vnode) => {
    const p = tk.propsOf(vnode)

    return {
      date: p.date ?? 'Present',
      title: p.header ?? '',
      icon: p.icon ?? 'i-lucide-rocket',
      description: cleanHTML(typeof p.text === 'string' ? p.text : ''),
      slot: 'rich',
    }
  }),
)

const wrapperClasses = computed(() =>
  ['w-full', props.classes, props.width, props.spacing].filter(Boolean).join(' '),
)
</script>

<template>
  <WrapDiv :align="align" :styles="wrapperClasses">
    <EditLink :link="editLink" :parent-uuid="parentUuid">
      <UTimeline
        class="max-w-3xl"
        :color="color ?? 'primary'"
        :default-value="timelineItems.length - 1"
        :items="timelineItems"
      >
        <template #rich-description="{ item }">
          <div class="prose max-w-none" v-html="item.description" />
        </template>
      </UTimeline>
    </EditLink>
  </WrapDiv>
</template>
