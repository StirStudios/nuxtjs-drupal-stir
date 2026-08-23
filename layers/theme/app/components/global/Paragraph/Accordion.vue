<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { Slots, VNode } from 'vue'
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
  direction?: string

  editLink?: string
}>()

type AccordionItemProps = {
  id?: number | string
  uuid?: string
  parentUuid?: string
  header?: string
  text?: string
  editLink?: string
}

type AccordionEntry = AccordionItem & {
  id?: number | string
  buttonNodes: VNode[]
  contentHtml: string
  editLink?: string
  parentUuid?: string
}

const slots = useSlots()
const trustedTextHtml = computed(() => trustedDrupalHtml(props.text))
const sectionClasses = computed(() =>
  [
    'paragraph-accordion space-y-6',
    props.align ? 'w-full' : '',
    props.align,
    props.width,
    props.spacing,
    props.classes,
  ].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
const accordionNodes = computed<VNode[]>(() => {
  const nodes = slots.items?.() ?? slots.accordionItems?.() ?? []

  return Array.isArray(nodes) ? nodes : []
})
const items = computed<AccordionEntry[]>(() =>
  accordionNodes.value.map((node, index) => {
    const itemProps = (node.props ?? {}) as AccordionItemProps
    const itemSlots = node.children as Slots | null
    const label = itemProps.header?.trim() || `Item ${index + 1}`
    const value = String(itemProps.uuid ?? itemProps.id ?? index)

    return {
      id: itemProps.id,
      label,
      value,
      buttonNodes: itemSlots?.buttons?.() ?? [],
      contentHtml: trustedDrupalHtml(itemProps.text),
      editLink: itemProps.editLink,
      parentUuid: itemProps.parentUuid,
    }
  }),
)
</script>

<template>
  <ParagraphReveal
    :id="id"
    as="section"
    :class="sectionClasses"
    :direction="direction"
  >
    <EditLink :id="id" :link="editLink" :parent-uuid="parentUuid" />

    <div v-if="header || trustedTextHtml" class="space-y-3">
      <component :is="headerTag || 'h2'" v-if="header">
        {{ header }}
      </component>
      <div
        v-if="trustedTextHtml"
        class="prose text-muted max-w-none"
        v-html="trustedTextHtml"
      />
    </div>

    <UAccordion
      v-if="items.length"
      :items="items"
      trailing-icon="i-lucide-plus"
      :ui="{
        root: 'rounded-2xl border border-default bg-default',
        trigger:
          'px-5 py-5 hover:bg-muted/40 data-[state=open]:bg-muted/40 md:px-6 md:py-6',
        label: 'text-highlighted text-lg font-semibold',
        trailingIcon: 'text-muted group-data-[state=open]:rotate-45',
        body: 'p-5 md:p-6',
      }"
      :unmount-on-hide="false"
    >
      <template #body="{ item }">
        <div
          v-if="item.contentHtml"
          class="prose text-muted max-w-none"
          v-html="item.contentHtml"
        />

        <component
          :is="node"
          v-for="(node, index) in item.buttonNodes"
          :key="node.key ?? index"
        />

        <EditLink :id="item.id" :link="item.editLink" :parent-uuid="item.parentUuid" />
      </template>
    </UAccordion>
  </ParagraphReveal>
</template>
