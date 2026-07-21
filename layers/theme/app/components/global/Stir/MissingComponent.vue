<script setup lang="ts">
import type {
  ComponentTreeDiagnosticKind,
} from '../../../utils/componentTreeDiagnostics'

const props = defineProps<{
  element: string
  kind: ComponentTreeDiagnosticKind
}>()

const title = computed(() => {
  if (props.kind === 'unknown-field') return 'Unknown Drupal field component'
  if (props.kind === 'invalid-shape') return 'Invalid Drupal component data'

  return 'Missing Drupal component'
})
</script>

<template>
  <UAlert
    class="m-auto my-6 max-w-lg"
    color="error"
    :description="element ? `Unresolved Custom Element: ${element}` : 'The component has no valid element name.'"
    :title="title"
    variant="subtle"
  />
</template>
