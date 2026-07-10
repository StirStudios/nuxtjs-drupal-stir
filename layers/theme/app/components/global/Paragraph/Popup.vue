<script setup lang="ts">
import { trustedDrupalHtml } from '~/utils/trustedDrupalHtml'
import type { WebformDefinition } from '~/types'

const props = defineProps<{
  id: number | string
  uuid: string
  parentUuid?: string
  region?: string

  text?: string
  alert?: string
  webform?: WebformDefinition

  direction?: string
  onClose?: () => void

  editLink?: string
}>()

const trustedTextHtml = computed(() => trustedDrupalHtml(props.text))
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <slot name="media" />
    <slot name="schedule" />

    <div class="space-y-6 p-5">
      <div
        v-if="trustedTextHtml"
        class="prose max-w-none"
        v-html="trustedTextHtml"
      />
      <ParagraphWebform
        v-if="props.webform"
        :on-close="props.onClose"
        :webform="props.webform"
      />
    </div>
  </EditLink>
</template>
