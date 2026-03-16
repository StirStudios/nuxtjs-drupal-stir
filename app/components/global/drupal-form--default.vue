<script setup lang="ts">
import type { DrupalFormProps } from '../../../types'

defineProps<DrupalFormProps>()
const route = useRoute()
</script>

<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form
        v-bind="attributes"
        :action="route.fullPath"
        class="drupal-form"
        :formId="formId"
        :method="method"
      >
        <slot><div class="space-y-6" v-html="content" /></slot>
      </form>
    </div>
  </div>
</template>

<style lang="css">
@reference '~/assets/css/main.css';

.drupal-form {
  .form-item {
    @apply mb-5;
    label {
      @apply text-default mb-2 block text-sm font-medium;
    }
    input,
    textarea {
      @apply bg-default text-highlighted ring-accented placeholder:text-dimmed focus-visible:ring-primary w-full gap-1.5 rounded-md border-0 px-2.5 py-2.5 text-sm ring transition-colors ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-75;
    }
  }
  .form-actions {
    input {
      @apply bg-primary hover:bg-primary/75 focus-visible:outline-primary disabled:bg-primary aria-disabled:bg-primary flex w-full justify-center gap-1.5 rounded-md px-3.5 py-2.5 text-base text-sm font-medium transition-colors focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75;
    }
  }
  .more-links {
    @apply text-default mt-3 block text-sm font-medium;
  }
}
</style>
