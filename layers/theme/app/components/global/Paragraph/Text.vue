<script setup lang="ts">
import type { EditableRichTextProps } from '#stir/types'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import { toEditableRichTextProps } from '#stir/utils/editableRichText'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<
  EditableRichTextProps & {
    eyebrow?: string
    align?: string
    card?: boolean
    cardVariant?: string
    width?: string
    spacing?: string
    region?: string
    textEdit?: unknown
  }
>()

const richTextProps = computed(() => toEditableRichTextProps(props))
const wrapStyles = computed(() =>
  [props.width, props.spacing].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
const isCard = computed(() => resolveBooleanProp(props.card))

const cardVariant = computed(() => {
  const variants = ['outline', 'solid', 'soft', 'subtle'] as const

  return variants.find((variant) => variant === props.cardVariant) ?? 'outline'
})
</script>

<template>
  <WrapDiv :align="align" :styles="wrapStyles">
    <UCard v-if="isCard" class="h-full" :variant="cardVariant">
      <p v-if="eyebrow?.trim()" class="eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase">{{ eyebrow }}</p>
      <EditableRichText v-bind="richTextProps" />
    </UCard>
    <div v-else-if="eyebrow?.trim()" class="paragraph-text">
      <p class="eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase">{{ eyebrow }}</p>
      <EditableRichText v-bind="richTextProps" />
    </div>
    <EditableRichText v-else v-bind="richTextProps" />
  </WrapDiv>
</template>
