<script setup lang="ts">
import { adminUiProps, adminUiTheme } from '../../utils/adminUiTheme'

withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Loading editor',
  },
)
</script>

<template>
  <UTheme :props="adminUiProps" :ui="adminUiTheme">
    <div class="admin-ui admin-ui-scope admin-ui-loading-state" role="status">
      <UIcon
        aria-hidden="true"
        class="admin-ui-loading-icon"
        name="i-lucide-loader-circle"
      />
      <span class="sr-only">{{ label }}</span>
    </div>
  </UTheme>
</template>

<style src="../../assets/css/admin-ui.css"></style>
