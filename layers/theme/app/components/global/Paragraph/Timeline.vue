<script setup lang="ts">
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { trustedDrupalHtml } from '~/utils/trustedDrupalHtml'
import { resolveUiColor } from '~/utils/nuxtUiProps'

type UITimelineItem = {
  date?: string
  title?: string
  icon?: string
  description?: string
  slot?: string
}

type TimelineNodeProps = {
  date?: unknown
  header?: unknown
  icon?: unknown
  text?: unknown
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

function stringProp(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

const timelineItems = computed<UITimelineItem[]>(() =>
  timelineNodes.value.map((vnode) => {
    const p = tk.propsOf<TimelineNodeProps>(vnode)

    return {
      date: stringProp(p.date, 'Present'),
      title: stringProp(p.header),
      icon: stringProp(p.icon, 'i-lucide-rocket'),
      description: trustedDrupalHtml(stringProp(p.text)),
      slot: 'rich',
    }
  }),
)

const wrapperClasses = computed(() =>
  ['w-full', props.classes, props.width, props.spacing].filter(Boolean).join(' '),
)
const timelineColor = computed(() => resolveUiColor(props.color))
</script>

<template>
  <WrapDiv :align="align" :styles="wrapperClasses">
    <EditLink :link="editLink" :parent-uuid="parentUuid">
      <UTimeline
        class="max-w-3xl"
        :color="timelineColor"
        :default-value="timelineItems.length - 1"
        :items="timelineItems"
      >
        <template #rich-description="{ item }: { item: UITimelineItem }">
          <div class="prose max-w-none" v-html="item.description" />
        </template>
      </UTimeline>
    </EditLink>
  </WrapDiv>
</template>
