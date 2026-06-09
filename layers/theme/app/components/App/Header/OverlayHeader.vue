<script setup lang="ts">
defineProps<{
  leftClass?: string
  logoClasses: string
  menuId?: string
  rightClass?: string
  showBrand: boolean
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
  <ULink
    v-if="showBrand"
    aria-label="Home"
    :class="[leftClass, titleClass]"
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

  <div :class="[rightClass, !showBrand ? 'ms-auto' : '']">
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
