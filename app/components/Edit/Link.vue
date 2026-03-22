<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
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
const anchorRef = ref<HTMLElement | null>(null)
const isTargetActive = ref(false)
const isControlsHovered = ref(false)
const controlsStyle = ref<Record<string, string>>({})
const targetElement = ref<HTMLElement | null>(null)
const stopTargetListeners = ref<Array<() => void>>([])
const domObserver = ref<MutationObserver | null>(null)

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

const shouldShowControls = computed(() =>
  actions.value.length > 0 && (isTargetActive.value || isControlsHovered.value),
)

function getStickyTopOffset(): number {
  if (import.meta.client === false) return 8

  const raw = window.getComputedStyle(document.documentElement)
    .getPropertyValue('--ui-header-height')
    .trim()
  let headerHeight = Number.parseFloat(raw) || 0

  if (headerHeight <= 0) {
    const headerEl = document.querySelector<HTMLElement>('header, .app-header, [data-slot="header"]')

    if (headerEl) {
      headerHeight = headerEl.getBoundingClientRect().height
    }
  }

  return headerHeight + 8
}

function updateControlsPosition(): void {
  if (import.meta.client === false || targetElement.value === null) return

  const rect = targetElement.value.getBoundingClientRect()
  const stickyTopOffset = getStickyTopOffset()
  const viewportPadding = 8
  const maxRight = Math.max(viewportPadding, window.innerWidth - viewportPadding)
  const right = Math.max(viewportPadding, window.innerWidth - Math.min(maxRight, rect.right))
  const top = Math.max(stickyTopOffset, rect.top)

  controlsStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    right: `${right}px`,
    zIndex: '100',
  }
}

function detachTargetListeners(): void {
  for (const stop of stopTargetListeners.value) {
    stop()
  }
  stopTargetListeners.value = []
  targetElement.value = null
}

function attachTargetListeners(): void {
  if (import.meta.client === false || anchorRef.value === null) return

  const siblingTarget = anchorRef.value.nextElementSibling
  const target = siblingTarget instanceof HTMLElement
    ? siblingTarget
    : anchorRef.value.parentElement

  if (target === null) return

  if (targetElement.value === target && stopTargetListeners.value.length > 0) return

  targetElement.value = target
  detachTargetListeners()
  stopTargetListeners.value = [
    useEventListener(target, 'pointerenter', () => {
      isTargetActive.value = true
      updateControlsPosition()
    }),
    useEventListener(target, 'focusin', () => {
      isTargetActive.value = true
      updateControlsPosition()
    }),
    useEventListener(target, 'pointerleave', () => { isTargetActive.value = false }),
    useEventListener(target, 'focusout', () => { isTargetActive.value = false }),
  ]
}

function refreshTargetBinding(): void {
  if (import.meta.client === false) return

  nextTick(() => {
    attachTargetListeners()
    updateControlsPosition()
  })
}

onMounted(() => {
  if (import.meta.client === false) return

  attachTargetListeners()
  useEventListener(window, 'scroll', updateControlsPosition, { passive: true })
  useEventListener(window, 'resize', updateControlsPosition, { passive: true })

  if (anchorRef.value?.parentElement) {
    domObserver.value = new MutationObserver(() => {
      refreshTargetBinding()
    })

    domObserver.value.observe(anchorRef.value.parentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
})

onUpdated(() => {
  refreshTargetBinding()
})

onBeforeUnmount(() => {
  if (domObserver.value) {
    domObserver.value.disconnect()
    domObserver.value = null
  }
  detachTargetListeners()
})
</script>

<template>
  <span ref="anchorRef" aria-hidden="true" class="hidden" />
  <slot />

  <Teleport to="body">
    <div
      v-if="shouldShowControls"
      class="pointer-events-none"
      :style="controlsStyle"
      @mouseenter="isControlsHovered = true"
      @mouseleave="isControlsHovered = false"
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
  </Teleport>
</template>
