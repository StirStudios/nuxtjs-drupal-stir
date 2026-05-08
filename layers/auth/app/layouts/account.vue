<script setup lang="ts">
import { useAccountNav } from '../composables/account/useAccountNav'

const sidebarOpen = ref(true)
const route = useRoute()
const { items } = useAccountNav()

const pageTitle = computed(() =>
  typeof route.meta.accountTitle === 'string'
    ? route.meta.accountTitle
    : 'Account',
)
</script>

<template>
  <div class="flex">
    <USidebar
      v-model:open="sidebarOpen"
      collapsible="icon"
      rail
      title="Account"
      :ui="{
        container: 'h-full',
        inner: 'bg-default',
      }"
    >
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :ui="{ link: 'p-1.5 overflow-hidden' }"
      />

      <template #footer>
        <UButton icon="i-lucide-arrow-left" size="sm" to="/" variant="ghost">
          Back to site
        </UButton>
      </template>
    </USidebar>

    <div class="flex min-w-0 flex-1 flex-col">
      <div
        class="border-default bg-default flex h-(--ui-header-height) shrink-0 items-center justify-between border-b px-4"
      >
        <UButton
          aria-label="Toggle sidebar"
          color="neutral"
          icon="i-lucide-panel-left"
          variant="ghost"
          @click="sidebarOpen = !sidebarOpen"
        />

        <span class="text-muted text-sm">{{ pageTitle }}</span>
        <div />
      </div>

      <main class="w-full px-4 py-8 md:px-8">
        <div class="mx-auto w-full max-w-4xl">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
