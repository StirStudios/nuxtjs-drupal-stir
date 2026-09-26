<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

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
  toggleColor?: ButtonProps['color']
  toggleIcon: string
  toggleIconClass?: string
  toggleVariant?: ButtonProps['variant']
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
      :color="toggleColor ?? 'neutral'"
      :variant="toggleVariant ?? 'ghost'"
      @click="$emit('close')"
    >
      <template #leading>
        <UIcon
          aria-hidden="true"
          :class="toggleIconClass"
          data-slot="leadingIcon"
          :name="toggleIcon"
        />
      </template>
    </UButton>
  </div>
</template>
