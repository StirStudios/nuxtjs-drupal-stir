<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  question?: string
  answer?: string

  editLink?: string
}>()

const safeAnswerHtml = computed(() => cleanHTML(props.answer ?? ''))
</script>

<template>
  <details class="group p-5 open:bg-muted/40 md:p-6">
    <summary class="flex cursor-pointer list-none items-center justify-between gap-6">
      <span class="text-highlighted text-lg font-semibold">
        {{ question }}
      </span>
      <UIcon
        class="text-muted size-5 shrink-0 transition group-open:rotate-45"
        name="i-lucide-plus"
      />
    </summary>

    <div
      v-if="safeAnswerHtml"
      class="prose mt-4 max-w-none text-muted"
      v-html="safeAnswerHtml"
    />

    <EditLink :link="editLink" :parent-uuid="parentUuid" />
  </details>
</template>
