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

interface EditAction {
  key: 'quick' | 'full'
  tooltip: string
  ariaLabel: string
  icon: string
  variant: 'soft' | 'outline'
  disabled?: boolean
  to?: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
  onClick?: () => void
}

const controlsWrapClass =
  'sticky top-[calc(var(--ui-header-height)+0.5rem)] z-100 h-0 overflow-visible pointer-events-none'
const controlsClass =
  'flex w-fit pointer-events-auto opacity-100 md:pointer-events-none md:opacity-0 md:transition-opacity md:duration-200 md:group-focus-within/edit:pointer-events-auto md:group-focus-within/edit:opacity-100 md:group-hover/edit:pointer-events-auto md:group-hover/edit:opacity-100'

const hasQuickEdit = computed(() => props.showQuickEdit === true)
const fullEditLink = computed(() => (typeof props.link === 'string' ? props.link.trim() : ''))
const hasLink = computed(() => fullEditLink.value.length > 0)
const isExternalLink = computed(() => /^https?:\/\//.test(fullEditLink.value))

const quickEditLabel = computed(() => props.quickEditLabel || 'Quick edit')
const fullEditLabel = computed(() => props.fullEditLabel || 'Full edit')
const singleActionLabel = computed(() => 'Edit')
const actionCount = computed(() => Number(hasQuickEdit.value) + Number(hasLink.value))
const hasSingleAction = computed(() => actionCount.value === 1)

const actions = computed<EditAction[]>(() => {
  const result: EditAction[] = []

  if (hasQuickEdit.value) {
    const tooltip = hasSingleAction.value ? singleActionLabel.value : quickEditLabel.value
    const ariaLabel = `${tooltip} this section`

    result.push({
      key: 'quick',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-zap',
      variant: 'soft',
      disabled: props.quickEditDisabled === true,
      onClick: () => emit('quick-edit'),
    })
  }

  if (hasLink.value) {
    const tooltip = hasSingleAction.value ? singleActionLabel.value : fullEditLabel.value
    const ariaLabel = isExternalLink.value
      ? `${tooltip} (opens in a new tab)`
      : `${tooltip} this section`

    result.push({
      key: 'full',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-square-pen',
      variant: 'outline',
      to: fullEditLink.value,
      target: isExternalLink.value ? '_blank' : undefined,
      rel: isExternalLink.value ? 'noopener noreferrer' : undefined,
    })
  }

  return result
})
</script>

<template>
  <div
    v-if="actions.length > 0"
    class="group/edit relative"
  >
    <div :class="controlsWrapClass">
      <UFieldGroup
        :class="['ml-auto', controlsClass, 'rounded-md bg-default/95 shadow-lg ring-1 ring-default backdrop-blur-sm']"
        size="xs"
      >
        <UTooltip v-for="action in actions" :key="action.key" :text="action.tooltip">
          <UButton
            :aria-label="action.ariaLabel"
            color="neutral"
            :disabled="action.disabled"
            :icon="action.icon"
            :rel="action.rel"
            :target="action.target"
            :to="action.to"
            :variant="action.variant"
            @click="action.onClick?.()"
          >
            <span class="sr-only">{{ action.ariaLabel }}</span>
          </UButton>
        </UTooltip>
      </UFieldGroup>
    </div>

    <slot />
  </div>

  <slot v-else />
</template>
