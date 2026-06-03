<script setup lang="ts">
defineProps<{
  leftClass?: string
  logoClasses: string
  menuId?: string
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
  <div :class="leftClass">
    <ULink
      aria-label="Home"
      :class="titleClass"
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

  <div :class="rightClass">
    <LazyIconsColorMode v-if="showColorModeToggle" />

    <UButton
      :aria-controls="menuId"
      aria-label="Close navigation menu"
      :class="toggleClass"
      color="neutral"
      :icon="toggleIcon"
      variant="ghost"
      @click="$emit('close')"
    />
  </div>
</template>
