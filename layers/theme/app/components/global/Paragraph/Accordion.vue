<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { Slots, VNode } from 'vue'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import { resolveHeadingTag } from '#stir/utils/headingTag'
import { resolveAlignClasses, resolveWidthClasses, type AlignConfig } from '#stir/utils/gridClasses'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  text?: string
  align?: AlignConfig
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
  headerTag?: string
  text?: string
  editLink?: string
}

type AccordionEntry = AccordionItem & {
  id?: number | string
  headingLevel: number | null
  buttonNodes: VNode[]
  contentHtml: string
  editLink?: string
  parentUuid?: string
}

// UAccordion's #default slot renders inside the trigger <button>, where a
// real heading element (h2-h6) is invalid — headings aren't phrasing
// content. role="heading" + aria-level exposes the same level to
// heading-navigation without nesting an element the button can't contain.
function headingLevelOf(tag: string): number | null {
  const match = /^h([2-6])$/.exec(tag)

  return match ? Number(match[1]) : null
}

const slots = useSlots()
const trustedTextHtml = computed(() => trustedDrupalHtml(props.text))
const sectionClasses = computed(() =>
  [
    'paragraph-accordion space-y-6',
    props.align ? 'w-full' : '',
    resolveAlignClasses(props.align),
    resolveWidthClasses(props.width, props.align),
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
      headingLevel: headingLevelOf(resolveHeadingTag(itemProps.headerTag)),
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

    <div
      v-if="trustedTextHtml"
      class="prose text-muted max-w-none"
      v-html="trustedTextHtml"
    />

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
      <template #default="{ item }">
        <span
          :aria-level="item.headingLevel ?? undefined"
          class="text-highlighted text-lg font-semibold"
          :role="item.headingLevel ? 'heading' : undefined"
        >
          {{ item.label }}
        </span>
      </template>

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
