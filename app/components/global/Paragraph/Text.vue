<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  text?: string

  align?: string
  width?: string
  spacing?: string
  classes?: string
  direction?: string

  editLink?: string
}>()

const safeTextHtml = computed(() => cleanHTML(props.text ?? ''))
</script>

<template>
  <EditLink :link="editLink">
    <WrapAnimate :effect="direction">
      <WrapAlign :align="align">
        <div
          v-if="safeTextHtml"
          :class="[
            [classes, 'prose'].filter(Boolean).join(' '),
            width,
            spacing,
          ]"
          v-html="safeTextHtml"
        />
      </WrapAlign>
    </WrapAnimate>
  </EditLink>
</template>
