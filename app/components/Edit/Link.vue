<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  link?: string
  showQuickEdit?: boolean
  quickEditDisabled?: boolean
  quickEditLabel?: string
  fullEditLabel?: string
}>()

const emit = defineEmits<{
  (e: 'quick-edit'): void
}>()

const controlsClass =
  'sticky top-[calc(var(--ui-header-height)+0.5rem)] z-100 flex ml-auto w-fit pointer-events-auto opacity-100 md:pointer-events-none md:opacity-0 md:transition-opacity md:duration-200 md:group-focus-within/edit:pointer-events-auto md:group-focus-within/edit:opacity-100 md:group-hover/edit:pointer-events-auto md:group-hover/edit:opacity-100'

const hasQuickEdit = computed(() => props.showQuickEdit === true)
const hasLink = computed(() => typeof props.link === 'string' && props.link.length > 0)
const hasBothActions = computed(() => hasQuickEdit.value && hasLink.value)
const isExternalLink = computed(() => {
  if (hasLink.value === false) return false

  return /^https?:\/\//.test(props.link as string)
})

const quickEditLabel = computed(() => props.quickEditLabel || 'Quick edit')
const fullEditLabel = computed(() => props.fullEditLabel || 'Full edit')
const singleActionLabel = computed(() => 'Edit')
const quickButtonLabel = computed(() => (hasBothActions.value ? quickEditLabel.value : singleActionLabel.value))
const fullButtonLabel = computed(() => (hasBothActions.value ? fullEditLabel.value : singleActionLabel.value))
const quickEditAriaLabel = computed(() =>
  hasBothActions.value ? `${quickEditLabel.value} this section` : `${singleActionLabel.value} this section`,
)
const fullEditAriaLabel = computed(() =>
  hasBothActions.value
    ? isExternalLink.value
      ? `${fullEditLabel.value} (opens in a new tab)`
      : `${fullEditLabel.value} this section`
    : isExternalLink.value
      ? `${singleActionLabel.value} (opens in a new tab)`
      : `${singleActionLabel.value} this section`,
)
</script>

<template>
  <div v-if="hasQuickEdit || hasLink" class="group/edit">
    <UFieldGroup
      :class="[controlsClass, 'rounded-md bg-default/95 shadow-lg ring-1 ring-default backdrop-blur-sm']"
      size="xs"
    >
      <UTooltip v-if="hasQuickEdit" :text="quickButtonLabel">
        <UButton
          :aria-label="quickEditAriaLabel"
          color="neutral"
          :disabled="props.quickEditDisabled === true"
          icon="i-lucide-zap"
          variant="soft"
          @click="emit('quick-edit')"
        >
          <span v-if="hasBothActions === false">{{ singleActionLabel }}</span>
          <span v-else class="sr-only">{{ quickEditAriaLabel }}</span>
        </UButton>
      </UTooltip>

      <UTooltip v-if="hasLink" :text="fullButtonLabel">
        <UButton
          :aria-label="fullEditAriaLabel"
          color="neutral"
          icon="i-lucide-square-pen"
          :rel="isExternalLink ? 'noopener noreferrer' : undefined"
          :target="isExternalLink ? '_blank' : undefined"
          :to="props.link"
          variant="outline"
        >
          <span v-if="hasBothActions === false">{{ singleActionLabel }}</span>
          <span v-else class="sr-only">{{ fullEditAriaLabel }}</span>
        </UButton>
      </UTooltip>
    </UFieldGroup>

    <slot />
  </div>

  <slot v-else />
</template>
