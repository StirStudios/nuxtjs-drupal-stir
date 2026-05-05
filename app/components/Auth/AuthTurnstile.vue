<script setup lang="ts">
const token = defineModel<string>()
</script>

<template>
  <FieldTurnstile v-model="token" />
</template>
