<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  header?: string
  text?: string
  align?: string
  classes?: string
  width?: string
  spacing?: string

  editLink?: string
}>()

const safeTextHtml = computed(() => cleanHTML(props.text ?? ''))
const wrapStyles = computed(() =>
  [props.width, props.spacing].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
</script>

<template>
  <WrapDiv :align="align" :styles="wrapStyles">
    <section :class="['paragraph-faq space-y-6', classes].filter(Boolean).join(' ')">
      <EditLink :link="editLink" :parent-uuid="parentUuid" />

      <div v-if="header || safeTextHtml" class="space-y-3">
        <h2 v-if="header" class="text-highlighted text-3xl font-semibold tracking-tight md:text-4xl">
          {{ header }}
        </h2>
        <div
          v-if="safeTextHtml"
          class="prose max-w-none text-muted"
          v-html="safeTextHtml"
        />
      </div>

      <div class="divide-y divide-default rounded-2xl border border-default bg-default">
        <slot name="items" />
      </div>
    </section>
  </WrapDiv>
</template>
