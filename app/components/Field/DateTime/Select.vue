<script setup lang="ts">
import { inputIdInjectionKey } from '@nuxt/ui/composables'

type SelectItem = {
  label: string
  value: string
}

defineProps<{
  items: SelectItem[]
  placeholder?: string
  variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
}>()

const model = defineModel<string>({ required: true })
const inputId = inject(inputIdInjectionKey, undefined)
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

function incrementTrailingIdPart(value: string): string {
  return value.replace(/-(\d+)$/, (_, idPart: string) => {
    return `-${Number(idPart) + 1}`
  })
}

const contentId = computed(() => {
  if (!inputId?.value) return undefined

  return `reka-select-content-${incrementTrailingIdPart(inputId.value)}`
})
</script>

<template>
  <USelect
    v-model="model"
    class="w-full"
    :items="items"
    :placeholder="placeholder"
    :variant="variant"
  />
  <div
    v-if="!mounted && contentId"
    :id="contentId"
    hidden
  />
</template>
