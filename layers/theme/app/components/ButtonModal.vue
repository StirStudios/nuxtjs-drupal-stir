<script setup lang="ts">
const props = defineProps<{
  modalId: string
}>()
</script>

<template>
  <UButton
    :aria-controls="props.modalId"
    aria-label="View more details"
    :data-modal-id="props.modalId"
    label="View More"
    size="sm"
    type="button"
  />
</template>
