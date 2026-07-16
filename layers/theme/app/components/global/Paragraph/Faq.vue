<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { VNode } from 'vue'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  header?: string
  headerTag?: string
  text?: string
  align?: string
  classes?: string
  width?: string
  spacing?: string

  editLink?: string
}>()

type FaqItemProps = {
  id?: number | string
  uuid?: string
  parentUuid?: string
  header?: string
  question?: string
  text?: string
  answer?: string
  editLink?: string
}

type FaqAccordionItem = AccordionItem & {
  answerHtml: string
  editLink?: string
  parentUuid?: string
}

const slots = useSlots()
const trustedTextHtml = computed(() => trustedDrupalHtml(props.text))
const sectionClasses = computed(() =>
  [
    'paragraph-faq space-y-6',
    props.align ? 'w-full' : '',
    props.align,
    props.width,
    props.spacing,
    props.classes,
  ].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
const faqNodes = computed<VNode[]>(() => {
  const nodes = slots.items?.() ?? slots.faqItems?.() ?? []

  return Array.isArray(nodes) ? nodes : []
})
const accordionItems = computed<FaqAccordionItem[]>(() =>
  faqNodes.value.map((node, index) => {
    const itemProps = (node.props ?? {}) as FaqItemProps
    const label = itemProps.question ?? itemProps.header ?? `Question ${index + 1}`
    const value = String(itemProps.uuid ?? itemProps.id ?? index)

    return {
      label,
      value,
      answerHtml: trustedDrupalHtml(itemProps.answer ?? itemProps.text),
      editLink: itemProps.editLink,
      parentUuid: itemProps.parentUuid,
    }
  }),
)
</script>

<template>
  <section :class="sectionClasses">
    <EditLink :link="editLink" :parent-uuid="parentUuid" />

    <div v-if="header || trustedTextHtml" class="space-y-3">
      <component
        :is="headerTag || 'h2'"
        v-if="header"
      >
        {{ header }}
      </component>
      <div
        v-if="trustedTextHtml"
        class="prose max-w-none text-muted"
        v-html="trustedTextHtml"
      />
    </div>

    <UAccordion
      v-if="accordionItems.length"
      :items="accordionItems"
      trailing-icon="i-lucide-plus"
      :ui="{
        root: 'rounded-2xl border border-default bg-default',
        item: 'border-b border-default last:border-b-0',
        trigger: 'px-5 py-5 text-left hover:bg-muted/40 data-[state=open]:bg-muted/40 md:px-6 md:py-6',
        label: 'text-highlighted text-lg font-semibold',
        trailingIcon: 'text-muted size-5 group-data-[state=open]:rotate-45',
        body: 'px-5 pb-5 pt-0 md:px-6 md:pb-6',
      }"
      :unmount-on-hide="false"
    >
      <template #body="{ item }">
        <div
          v-if="item.answerHtml"
          class="prose max-w-none text-muted"
          v-html="item.answerHtml"
        />

        <EditLink :link="item.editLink" :parent-uuid="item.parentUuid" />
      </template>
    </UAccordion>
  </section>
</template>
