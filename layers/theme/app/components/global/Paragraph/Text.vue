<script setup lang="ts">
import type { EditableRichTextProps } from '#stir/types'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<
  EditableRichTextProps & {
    eyebrow?: string
    align?: string
    card?: boolean | string | number
    cardVariant?: string
    width?: string
    spacing?: string
    region?: string
    textEdit?: unknown
  }
>()

const richTextProps = computed(() => ({
  id: props.id,
  uuid: props.uuid,
  parentUuid: props.parentUuid,
  text: props.text,
  textSource: props.textSource,
  classes: props.classes,
  direction: props.direction,
  editLink: props.editLink,
  editTarget: props.editTarget ?? props.textEdit,
}))
const wrapStyles = computed(() =>
  [props.width, props.spacing, props.eyebrow?.trim() && !isCard.value && 'paragraph-text'].filter(
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
      <p v-if="eyebrow?.trim()" class="paragraph-eyebrow">{{ eyebrow }}</p>
      <EditableRichText v-bind="richTextProps" />
    </UCard>
    <template v-else>
      <p v-if="eyebrow?.trim()" class="paragraph-eyebrow">{{ eyebrow }}</p>
      <EditableRichText v-bind="richTextProps" />
    </template>
  </WrapDiv>
</template>
