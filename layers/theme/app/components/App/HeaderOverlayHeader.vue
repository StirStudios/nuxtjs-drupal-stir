<script setup lang="ts">
defineProps<{
  headerClass?: string
  leftClass?: string
  logoClasses: string
  rightClass?: string
  showColorModeToggle: boolean
  showLogo: boolean
  siteTitle: string
  titleClass?: string
  toggleClass?: string
  toggleIcon: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    :class="headerClass"
    data-slot="header"
  >
    <div
      :class="leftClass"
      data-slot="left"
    >
      <ULink
        aria-label="Home"
        :class="titleClass"
        data-slot="title"
        to="/"
      >
        <AppLogo
          v-if="showLogo"
          :add-classes="logoClasses"
        />
        <template v-else>
          {{ siteTitle }}
        </template>
      </ULink>
    </div>

    <div
      :class="rightClass"
      data-slot="right"
    >
      <LazyIconsColorMode v-if="showColorModeToggle" />

      <UButton
        aria-label="Close navigation menu"
        :class="toggleClass"
        color="neutral"
        data-slot="toggle"
        :icon="toggleIcon"
        variant="ghost"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>
