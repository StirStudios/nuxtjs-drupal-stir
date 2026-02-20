<script setup lang="ts">
import { useCalendlyWidget } from '~/composables/useCalendlyWidget'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  calendlyUrl?: string
  calendlyScheme?: string
  calendlyBg?: string
  calendlyPrimary?: string
  calendlyTextColor?: string
  title?: string

  editLink?: string
}>()

const container = ref<HTMLElement | null>(null)
const calendlyUrl = computed(() => {
  const rawUrl = props.calendlyUrl?.trim()

  if (!rawUrl) return ''

  const backgroundColor = props.calendlyBg?.replace('#', '')
  const primaryColor = props.calendlyPrimary?.replace('#', '')
  const textColor = props.calendlyTextColor?.replace('#', '')

  try {
    const url = new URL(rawUrl)

    if (backgroundColor) url.searchParams.set('background_color', backgroundColor)
    if (primaryColor) url.searchParams.set('primary_color', primaryColor)
    if (textColor) url.searchParams.set('text_color', textColor)
    return url.toString()
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?'
    const params = [
      backgroundColor ? `background_color=${backgroundColor}` : null,
      primaryColor ? `primary_color=${primaryColor}` : null,
      textColor ? `text_color=${textColor}` : null,
    ]
      .filter(Boolean)
      .join('&')

    return params ? `${rawUrl}${separator}${params}` : rawUrl
  }
})

useCalendlyWidget(container, calendlyUrl.value)
</script>

<template>
  <EditLink :link="editLink">
    <div
      ref="container"
      :class="['m-auto w-full', props.calendlyScheme || 'scheme-normal']"
      v-bind="$attrs"
    />
  </EditLink>
</template>
