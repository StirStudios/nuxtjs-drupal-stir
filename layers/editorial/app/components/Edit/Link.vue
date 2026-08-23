<script setup lang="ts">
import type { EditAction } from '#stir/types'
import {
  buildLayoutEditLinkIndex,
  layoutEditLinksKey,
  withEditorDestination,
} from '#stir/utils/layoutEditLinks'

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
  controlsPlacement?: 'sibling' | 'slot' | 'isolated'
}>()

const emit = defineEmits<{
  (e: 'quick-edit'): void
}>()

const slots = useSlots()
const { getPage } = useStirDrupalCe()
const page = getPage()
const route = useRoute()
const requestUrl = useRequestURL()
const providedLayoutEditLinks = inject(layoutEditLinksKey, null)
const fallbackLayoutEditLinks = providedLayoutEditLinks
  ? null
  : computed(() => buildLayoutEditLinkIndex(page.value))

const hasQuickEdit = computed(() => props.showQuickEdit === true)
const frontendReturnUrl = computed(() =>
  new URL(route.fullPath, requestUrl.origin).toString(),
)
const fullEditLink = computed(() => {
  const link = typeof props.link === 'string' ? props.link.trim() : ''

  return link ? withEditorDestination(link, frontendReturnUrl.value) : ''
})
const hasLink = computed(() => fullEditLink.value.length > 0)

const layoutEditLink = computed(() => {
  const explicitLink =
    typeof props.layoutLink === 'string' ? props.layoutLink.trim() : ''

  if (explicitLink) {
    return withEditorDestination(explicitLink, frontendReturnUrl.value)
  }

  const parentUuid =
    typeof props.parentUuid === 'string' ? props.parentUuid.trim() : ''

  if (!parentUuid) return ''

  const target = (
    providedLayoutEditLinks?.value.get(parentUuid)
    ?? fallbackLayoutEditLinks?.value.get(parentUuid)
    ?? null
  )

  return target
    ? withEditorDestination(target.editLink, frontendReturnUrl.value)
    : ''
})
const layoutParagraphId = computed(() => {
  const parentUuid = typeof props.parentUuid === 'string'
    ? props.parentUuid.trim()
    : ''

  return parentUuid
    ? (
        providedLayoutEditLinks?.value.get(parentUuid)
        ?? fallbackLayoutEditLinks?.value.get(parentUuid)
      )?.paragraphId ?? null
    : null
})
const hasLayoutLink = computed(
  () =>
    layoutEditLink.value.length > 0 &&
    layoutEditLink.value !== fullEditLink.value,
)
const quickEditLabel = computed(() => props.quickEditLabel || 'Quick edit')
const fullEditLabel = computed(() => props.fullEditLabel || 'Full edit')
const layoutEditLabel = computed(() => 'Edit layout')
const presentationEditLink = computed(() =>
  layoutParagraphId.value !== null
    ? layoutEditLink.value
    : fullEditLink.value,
)
const presentationParagraphId = computed(() =>
  presentationEditLink.value
    ? layoutParagraphId.value ?? (
        Number.isInteger(Number(props.id)) && Number(props.id) > 0
          ? Number(props.id)
          : null
      )
    : null,
)
const singleActionLabel = computed(() => 'Edit')
const actionButtonClass =
  'admin-ui-btn-base admin-ui-btn-neutral admin-ui-btn-soft'

const actions = computed<EditAction[]>(() => {
  const result: EditAction[] = []
  const hasSingleAction =
    Number(hasQuickEdit.value) +
      Number(hasLink.value) +
      Number(presentationParagraphId.value !== null) ===
    1

  if (hasQuickEdit.value) {
    const tooltip = hasSingleAction
      ? singleActionLabel.value
      : quickEditLabel.value
    const ariaLabel = `${tooltip} this section`

    result.push({
      key: 'quick',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-zap',
      variant: 'soft',
      buttonClass: actionButtonClass,
      disabled: props.quickEditDisabled === true,
    })
  }

  if (hasLink.value) {
    const tooltip = hasSingleAction
      ? singleActionLabel.value
      : fullEditLabel.value
    const ariaLabel = `${tooltip} this section`

    result.push({
      key: 'full',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-square-pen',
      variant: 'soft',
      buttonClass: actionButtonClass,
      to: fullEditLink.value,
      navigateInPlace: true,
    })
  }

  if (presentationParagraphId.value !== null) {
    const tooltip = hasSingleAction
      ? singleActionLabel.value
      : hasLayoutLink.value ? layoutEditLabel.value : 'Quick settings'
    const ariaLabel = `${tooltip} for this section`

    result.push({
      key: 'presentation',
      tooltip,
      ariaLabel,
      icon: 'i-lucide-layout-template',
      variant: 'soft',
      buttonClass: actionButtonClass,
      paragraphId: presentationParagraphId.value,
      fullEditLink: presentationEditLink.value,
    })
  }

  return result
})

const hasActions = computed(() => actions.value.length > 0)
const rendersSiblingControls = computed(
  () => props.controlsPlacement !== 'slot',
)
const isolatesControls = computed(
  () =>
    props.controlsPlacement === 'isolated' &&
    slots.default !== undefined,
)

const handleActionSelect = (key: EditAction['key']) => {
  if (key === 'quick') emit('quick-edit')
}
</script>

<template>
  <div
    v-if="isolatesControls"
    class="admin-ui-edit-shell"
  >
    <slot
      :actions="actions"
      :has-actions="hasActions"
      :select-action="handleActionSelect"
    />
    <LazyEditControls
      v-if="hasActions"
      :actions="actions"
      @select="handleActionSelect"
    />
  </div>
  <template v-else>
    <slot
      :actions="actions"
      :has-actions="hasActions"
      :select-action="handleActionSelect"
    />
    <LazyEditControls
      v-if="hasActions && rendersSiblingControls"
      :actions="actions"
      @select="handleActionSelect"
    />
  </template>
</template>
