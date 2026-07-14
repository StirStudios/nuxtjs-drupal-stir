<script setup lang="ts">
import type { EditAction, EditActionKey } from '~/types/EditControls'
import { adminUiTheme } from '~/utils/adminUiTheme'

const props = defineProps<{
  actions: EditAction[]
  containerClass?: string | string[]
  renderAsButtons?: boolean
}>()

const router = useRouter()

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

const openActionInBrowser = (action: EditAction) => {
  if (!action.to || !import.meta.client) return

  if (action.target === '_blank') {
    window.open(action.to, '_blank', 'noopener,noreferrer')
    return
  }

  if (/^[a-z][a-z\d+.-]*:/.test(action.to)) {
    window.location.assign(action.to)
    return
  }

  void router.push(action.to)
}

const handleActionClick = (action: EditAction) => {
  closeAllTooltips()

  if (action.to && props.renderAsButtons === true) {
    openActionInBrowser(action)
  }

  emit('select', action.key)
}

const handleTooltipOpenUpdate = (key: EditActionKey, value: boolean) => {
  setTooltipOpen(key, value)
}
</script>

<template>
  <UTheme :ui="adminUiTheme">
    <UFieldGroup
      :class="[
        'admin-ui admin-ui-scope admin-ui-controls top-2 right-2 rounded-md shadow-lg transition-opacity absolute z-100',
        props.containerClass,
      ]"
      data-admin-ui-controls
      size="xs"
      @click.stop
      @keydown.stop
      @pointerdown.stop
    >
      <UTooltip
        v-for="action in actions"
        :key="action.key"
        :open="Boolean(tooltipOpen[action.key])"
        :text="action.tooltip"
        :ui="{
          content: 'admin-ui-scope admin-ui-tooltip-content',
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
          :rel="props.renderAsButtons ? undefined : action.rel"
          :target="props.renderAsButtons ? undefined : action.target"
          :to="props.renderAsButtons ? undefined : action.to"
          :ui="{ base: action.buttonClass }"
          :variant="action.variant"
          @click="handleActionClick(action)"
          @pointerdown="closeAllTooltips()"
        >
          <span class="sr-only">{{ action.ariaLabel }}</span>
        </UButton>
      </UTooltip>
    </UFieldGroup>
  </UTheme>
</template>

<style src="../../assets/css/admin-ui.css"></style>
