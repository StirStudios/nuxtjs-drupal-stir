<script setup lang="ts">
import { adminUiTheme } from '~/utils/adminUiTheme'

type EditActionKey = 'quick' | 'full' | 'layout'

interface EditAction {
  key: EditActionKey
  tooltip: string
  ariaLabel: string
  icon: string
  variant: 'soft' | 'outline'
  buttonClass: string
  disabled?: boolean
  to?: string
  target?: '_blank'
  rel?: 'noopener noreferrer'
}

defineProps<{
  actions: EditAction[]
}>()

const emit = defineEmits<{
  (e: 'select', key: EditActionKey): void
}>()

const tooltipOpen = ref<Record<string, boolean>>({})

const setTooltipOpen = (key: EditActionKey, value: boolean) => {
  tooltipOpen.value = {
    ...tooltipOpen.value,
    [key]: value,
  }
}

const closeAllTooltips = () => {
  tooltipOpen.value = {}
}

const handleActionClick = (key: EditActionKey) => {
  closeAllTooltips()
  emit('select', key)
}

const handleTooltipOpenUpdate = (key: EditActionKey, value: boolean) => {
  setTooltipOpen(key, value)
}
</script>

<template>
  <UTheme :ui="adminUiTheme">
    <UFieldGroup
      class="admin-ui admin-ui-scope admin-ui-controls pointer-events-none absolute top-2 right-2 z-100 rounded-md opacity-0 shadow-lg transition-opacity"
      data-admin-ui-controls
      size="xs"
    >
      <UTooltip
        v-for="action in actions"
        :key="action.key"
        :open="Boolean(tooltipOpen[action.key])"
        :text="action.tooltip"
        :ui="{
          content: 'admin-ui-tooltip-content',
          arrow: 'admin-ui-tooltip-arrow',
        }"
        @update:open="
          (value: boolean) => handleTooltipOpenUpdate(action.key, value)
        "
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
          @click="handleActionClick(action.key)"
          @pointerdown="closeAllTooltips()"
        >
          <span class="sr-only">{{ action.ariaLabel }}</span>
        </UButton>
      </UTooltip>
    </UFieldGroup>
  </UTheme>
</template>
