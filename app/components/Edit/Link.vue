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
  buttonClass: string
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
const actionButtonClass = 'admin-ui-btn-base admin-ui-btn-neutral admin-ui-btn-soft'

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
      buttonClass: actionButtonClass,
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
      variant: 'soft',
      buttonClass: actionButtonClass,
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
  <div v-if="hasActions" class="admin-ui-edit-shell group/admin-ui relative">
    <slot />
    <UTheme :ui="adminUiTheme">
      <UFieldGroup
        class="admin-ui admin-ui-scope admin-ui-controls pointer-events-auto absolute right-2 top-2 z-100 rounded-md shadow-lg opacity-0 transition-opacity group-hover/admin-ui:opacity-100 group-focus-within/admin-ui:opacity-100"
        size="xs"
      >
        <UTooltip
          v-for="action in actions"
          :key="action.key"
          :text="action.tooltip"
          :ui="{ content: 'admin-ui-tooltip-content', arrow: 'admin-ui-tooltip-arrow' }"
        >
          <UButton
            :aria-label="action.ariaLabel"
            color="neutral"
            :disabled="action.disabled"
            :icon="action.icon"
            :rel="action.rel"
            :target="action.target"
            :to="action.to"
            :ui="{ base: action.buttonClass }"
            :variant="action.variant"
            @click="action.onClick?.()"
          >
            <span class="sr-only">{{ action.ariaLabel }}</span>
          </UButton>
        </UTooltip>
      </UFieldGroup>
    </UTheme>
  </div>
  <slot v-else />
</template>
