<script setup lang="ts">
import type { EditableRichTextProps } from '#stir/types'

const props = defineProps<
  EditableRichTextProps & {
    align?: string
    width?: string
    spacing?: string
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
}))
const wrapStyles = computed(() =>
  [props.width, props.spacing].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
</script>

<template>
  <WrapDiv :align="align" :styles="wrapStyles">
    <EditableRichText v-bind="richTextProps" />
  </WrapDiv>
</template>
