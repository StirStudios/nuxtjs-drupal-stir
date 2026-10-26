<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { transformOptions } from '#stir-webform/utils/transformUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string>
}>()

const transformedOptions = computed(() =>
  transformOptions(props.field['#options'] || {}),
)
// Options with descriptions (Webform's "label -- description") read as cards.
const hasDescriptions = computed(() => transformedOptions.value.some((option) => option.description))
const card = useStirWebformTheme().cardRadio
const cardUi = computed(() => {
  // A selected card gets a solid ring, a change of weight and not only of
  // colour, which also shows the choice when a site hides the radio dot
  // (WCAG 1.4.1, 1.4.11).
  const base: Record<string, string> = {
    fieldset: 'grid gap-3 sm:grid-cols-2',
    item: 'items-start p-5 has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-primary',
  }

  for (const [slot, classes] of Object.entries(card?.ui ?? {})) base[slot] = [base[slot], classes].filter(Boolean).join(' ')

  return base
})

</script>

<template>
  <URadioGroup
    v-model="state[fieldName]"
    class="form-input w-full"
    :indicator="hasDescriptions ? card?.indicator : undefined"
    :items="transformedOptions"
    :orientation="hasDescriptions || field['#orientation'] === 'horizontal' ? 'horizontal' : 'vertical'"
    :size="hasDescriptions ? card?.size : undefined"
    :ui="hasDescriptions ? cardUi : undefined"
    :variant="hasDescriptions ? 'card' : 'list'"
  >
    <template #description="{ item }">
      <span class="mt-2 block whitespace-pre-line">{{ item.description }}</span>
    </template>
  </URadioGroup>
</template>
