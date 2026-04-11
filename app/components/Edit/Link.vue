<script setup lang="ts">
import { adminUiTheme } from '~/utils/adminUiTheme'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  link?: string
  layoutLink?: string
  showQuickEdit?: boolean
  quickEditDisabled?: boolean
  quickEditLabel?: string
  fullEditLabel?: string
}>()

const emit = defineEmits<{
  (e: 'quick-edit'): void
}>()

const { getPage } = useDrupalCe()
const page = getPage()

type CustomElementNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

function findLayoutEditLinkByUuid(value: unknown, uuid: string): string {
  if (!value) return ''

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findLayoutEditLinkByUuid(item, uuid)

      if (found) return found
    }
    return ''
  }

  if (typeof value !== 'object') return ''

  const node = value as CustomElementNode
  const nodeProps = (node.props ?? {}) as Record<string, unknown>
  const nodeUuid = typeof nodeProps.uuid === 'string' ? nodeProps.uuid : ''
  const nodeElement = typeof node.element === 'string' ? node.element : ''
  const nodeEditLink = typeof nodeProps.editLink === 'string' ? nodeProps.editLink.trim() : ''

  if (nodeUuid === uuid && nodeElement === 'paragraph-layout') {
    return nodeEditLink
  }

  for (const child of Object.values(node)) {
    const found = findLayoutEditLinkByUuid(child, uuid)

    if (found) return found
  }

  return ''
}

interface EditAction {
  key: 'quick' | 'full' | 'layout'
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

const layoutEditLink = computed(() => {
  const explicitLink = typeof props.layoutLink === 'string' ? props.layoutLink.trim() : ''

  if (explicitLink) return explicitLink

  const parentUuid = typeof props.parentUuid === 'string' ? props.parentUuid.trim() : ''

  if (!parentUuid) return ''

  return findLayoutEditLinkByUuid(page.value, parentUuid)
})
const hasLayoutLink = computed(() => layoutEditLink.value.length > 0 && layoutEditLink.value !== fullEditLink.value)
const isExternalLayoutLink = computed(() => /^https?:\/\//.test(layoutEditLink.value))

const quickEditLabel = computed(() => props.quickEditLabel || 'Quick edit')
const fullEditLabel = computed(() => props.fullEditLabel || 'Full edit')
const layoutEditLabel = computed(() => 'Edit layout')
const singleActionLabel = computed(() => 'Edit')
const actionButtonClass = 'admin-ui-btn-base admin-ui-btn-neutral admin-ui-btn-soft'

const actions = computed<EditAction[]>(() => {
  const result: EditAction[] = []
  const hasSingleAction = Number(hasQuickEdit.value) + Number(hasLink.value) + Number(hasLayoutLink.value) === 1

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

  if (hasLayoutLink.value) {
    const tooltip = hasSingleAction ? singleActionLabel.value : layoutEditLabel.value
    const ariaLabel = isExternalLayoutLink.value
      ? `${tooltip} (opens in a new tab)`
      : `${tooltip} this layout`

    result.push({
      key: 'layout',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-layout-template',
      variant: 'soft',
      buttonClass: actionButtonClass,
      to: layoutEditLink.value,
      target: isExternalLayoutLink.value ? '_blank' : undefined,
      rel: isExternalLayoutLink.value ? 'noopener noreferrer' : undefined,
    })
  }

  return result
})

const hasActions = computed(() => actions.value.length > 0)
const tooltipOpen = ref<Record<string, boolean>>({})

const setTooltipOpen = (key: EditAction['key'], value: boolean) => {
  tooltipOpen.value = {
    ...tooltipOpen.value,
    [key]: value,
  }
}

const closeAllTooltips = () => {
  tooltipOpen.value = {}
}
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
          :open="Boolean(tooltipOpen[action.key])"
          :text="action.tooltip"
          :ui="{ content: 'admin-ui-tooltip-content', arrow: 'admin-ui-tooltip-arrow' }"
          @update:open="(value) => setTooltipOpen(action.key, value)"
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
            @click="
              closeAllTooltips()
              action.onClick?.()
            "
            @pointerdown="closeAllTooltips()"
          >
            <span class="sr-only">{{ action.ariaLabel }}</span>
          </UButton>
        </UTooltip>
      </UFieldGroup>
    </UTheme>
  </div>
  <slot v-else />
</template>
