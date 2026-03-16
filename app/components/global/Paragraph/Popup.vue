<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  id: number | string
  uuid: string
  parentUuid?: string
  region?: string

  text?: string
  alert?: string
  webform?: unknown

  direction?: string
  onClose?: () => void

  editLink?: string
}>()

const safeTextHtml = computed(() => cleanHTML(props.text ?? ''))
</script>

<template>
  <EditLink :link="editLink">
    <slot name="media" />
    <slot name="schedule" />

    <div class="space-y-6 p-5">
      <div v-if="safeTextHtml" class="prose max-w-none" v-html="safeTextHtml" />
      <ParagraphWebform
        v-if="props.webform"
        :on-close="props.onClose"
        :webform="props.webform"
      />
    </div>
  </EditLink>
</template>
