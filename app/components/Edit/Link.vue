<script setup lang="ts">
import { adminUiTheme } from '~/utils/adminUiTheme'

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

const hasQuickEdit = computed(() => props.showQuickEdit === true)
const fullEditLink = computed(() => (typeof props.link === 'string' ? props.link.trim() : ''))
const hasLink = computed(() => fullEditLink.value.length > 0)
const isExternalLink = computed(() => /^https?:\/\//.test(fullEditLink.value))

const quickEditLabel = computed(() => props.quickEditLabel || 'Quick edit')
const fullEditLabel = computed(() => props.fullEditLabel || 'Full edit')
const singleActionLabel = computed(() => 'Edit')

const actions = computed<EditAction[]>(() => {
  const result: EditAction[] = []
  const hasSingleAction = Number(hasQuickEdit.value) + Number(hasLink.value) === 1

  if (hasQuickEdit.value) {
    const tooltip = hasSingleAction ? singleActionLabel.value : quickEditLabel.value
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
    const tooltip = hasSingleAction ? singleActionLabel.value : fullEditLabel.value
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

const hasActions = computed(() => actions.value.length > 0)
</script>

<template>
  <div class="admin-ui-edit-shell group relative">
    <slot />
    <div
      v-if="hasActions"
      class="pointer-events-none absolute right-2 top-2 z-100 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <UTheme :ui="adminUiTheme">
        <UFieldGroup
          class="admin-ui admin-ui-scope admin-ui-controls pointer-events-auto rounded-md shadow-lg"
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
      </UTheme>
    </div>
  </div>
</template>
